import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { compilerStatus, prepareWithAI } from '../api/compiler';
import { CompilationSession } from '../api/compilation-session';
import { loadMessages, messageStorageKey } from '../domain/message-storage';
import { prepareMessage, type Message } from '../domain/queue';
import { mergeCompilationResults } from '../domain/compilation-results';
import { initialRules, ruleContext } from '../levels/rules';
import type { LevelDefinition } from '../levels/types';
import type { CanvasLab } from '../physics/canvas-lab';
import { needsAIReview } from '../../../shared/ai-review';

interface PreparationOptions { draftsOnly?:boolean; messageId?:string; onReady?:(ids:string[])=>void }

// Owns preparation and persistence only. Sending a prepared rule belongs to the game session.
export function usePreparedMessages(level: LevelDefinition, labRef: RefObject<CanvasLab | null>, onNotice: (text: string) => void) {
  const context = useMemo(() => ruleContext(level), [level]);
  const [messages, setMessages] = useState(() => loadMessages(level));
  const messageRef = useRef(messages);
  const [compilation] = useState(() => new CompilationSession());
  const [api, setApi] = useState({ configured: false, model: '' });
  const [preparing, setPreparingState] = useState(false);
  const preparingRef = useRef(false);
  const immediateRef = useRef<object | null>(null);
  const autoPrepare = useRef(true);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const setPreparing = useCallback((value:boolean) => {
    preparingRef.current=value;
    setPreparingState(value);
  },[]);
  const cancelImmediate = useCallback(() => {immediateRef.current=null;},[]);

  const updateMessages = useCallback((next: Message[], options?:{autoPrepare?:boolean}) => {
    immediateRef.current=null;
    if(options?.autoPrepare!==undefined)autoPrepare.current=options.autoPrepare;
    else if(next.some(message=>message.status==='draft' && !messageRef.current.some(previous=>
      previous.id===message.id && previous.text===message.text && previous.status==='draft')))autoPrepare.current=true;
    compilation.queueChanged();
    setPreparing(false);
    messageRef.current = next;
    setMessages(next);
  }, [compilation,setPreparing]);

  const localMessage = useCallback((messageId: string, text: string) => {
    const message = prepareMessage(messageId, text, context, initialRules(level));
    return message.requiresAI && api.configured ? { ...message, status: 'draft' as const, error: undefined } : message;
  }, [context, level, api.configured]);

  const invalidateScene = useCallback(() => {
    immediateRef.current=null;
    compilation.sceneChanged();
    setPreparing(false);
    autoPrepare.current=true;
  }, [compilation,setPreparing]);

  const cancelPreparation = useCallback(() => {
    immediateRef.current=null;
    autoPrepare.current=false;
    compilation.queueChanged();setPreparing(false);
    onNotice('Preparation cancelled. Ready messages can be sent; choose Prepare for waiting messages.');
  },[compilation,setPreparing,onNotice]);

  const prepareQueue = useCallback(async (options:PreparationOptions = {}) => {
    const lab = labRef.current;
    if (!lab || preparingRef.current || lab.world.won || lab.world.timedOut || lab.isAbsorbing) return;
    const pending = messageRef.current.filter(message => options.messageId ? message.id===options.messageId && message.status!=='sent'
      : options.draftsOnly ? message.status === 'draft' : message.status !== 'sent');
    if (!pending.length) return;
    const ticket = compilation.begin();
    if (!ticket) return;
    immediateRef.current=options.onReady?ticket:null;
    lab.world.pause();
    lab.report();
    setPreparing(true);
    const request = {
      requestId: crypto.randomUUID(), levelId: level.id,
      sceneVersion: ticket.sceneVersion, queueRevision: ticket.queueRevision,
      messages: pending.map(({ id, text }) => ({ id, text })), rules: structuredClone(lab.world.rules),
    };
    onNotice('Reading your rule…');
    try {
      const result = await prepareWithAI(request, ticket.signal);
      if (!compilation.isCurrent(ticket)) return;
      const merged = mergeCompilationResults(messageRef.current, result.messages, lab.world.rules, context);
      const applyImmediately=options.onReady && immediateRef.current===ticket
        && !needsAIReview(merged.messages.find(message => message.id === options.messageId));
      updateMessages(merged.messages,{autoPrepare:false});
      if(applyImmediately && options.messageId && merged.readyIds.includes(options.messageId))options.onReady!([options.messageId]);
      else onNotice(merged.messages.some(message => merged.readyIds.includes(message.id) && needsAIReview(message))
        ? `${merged.notice} Review AI revisions before Send now.` : merged.notice);
    } catch (error) {
      if (!compilation.isCurrent(ticket)) return;
      const reason = error instanceof Error ? error.message : 'Could not read this rule. Edit it and try again.';
      const failed = new Set(pending.filter(message => message.status === 'draft').map(message => message.id));
      if (failed.size) updateMessages(messageRef.current.map(message => (
        failed.has(message.id) ? { ...message, status: 'error', error: reason } : message
      )),{autoPrepare:false});
      onNotice(reason);
    } finally {
      if (compilation.finish(ticket)) setPreparing(false);
    }
  }, [labRef, compilation, level, context, updateMessages, onNotice,setPreparing]);

  useEffect(() => {
    try {
      localStorage.setItem(messageStorageKey(level), JSON.stringify(messages.map(message => message.text)));
    } catch {
      setStorageAvailable(false);
    }
  }, [messages, level]);

  useEffect(() => {
    const controller = new AbortController();
    compilerStatus(controller.signal).then(setApi).catch(() => {});
    return () => {
      controller.abort();
      immediateRef.current=null;
      compilation.cancel();
    };
  }, [compilation]);

  useEffect(() => {
    if (autoPrepare.current && api.configured && !preparing && messages.some(message => message.status === 'draft')) void prepareQueue({draftsOnly:true});
  }, [messages, api.configured, preparing, prepareQueue]);

  useEffect(() => {
    if (api.configured && messageRef.current.some(message => message.status === 'error' && message.requiresAI)) {
      updateMessages(messageRef.current.map(message => message.status === 'error' && message.requiresAI
        ? { ...message, status: 'draft', error: undefined } : message));
    }
  }, [api.configured, updateMessages]);

  return { messages, messageRef, api, preparing, storageAvailable, updateMessages, localMessage, prepareQueue, invalidateScene,
    cancelImmediate,cancelPreparation,isPreparing:()=>preparingRef.current };
}
