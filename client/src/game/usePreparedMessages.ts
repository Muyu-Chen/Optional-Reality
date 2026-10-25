import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { applyRules } from '../../../shared/rules';
import { limitAbsoluteOperations } from '../../../shared/rule-limits';
import { compilerStatus, prepareWithAI } from '../api/compiler';
import { CompilationSession } from '../api/compilation-session';
import { loadMessages, messageStorageKey } from '../domain/message-storage';
import { prepareMessage, type Message } from '../domain/queue';
import { initialRules, ruleContext } from '../levels/rules';
import type { LevelDefinition } from '../levels/types';
import type { CanvasLab } from '../physics/canvas-lab';

interface ImmediatePreparation { id:string; onReady:(ids:string[])=>void }

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
  const [storageAvailable, setStorageAvailable] = useState(true);
  const setPreparing = useCallback((value:boolean) => {
    preparingRef.current=value;
    setPreparingState(value);
  },[]);
  const cancelImmediate = useCallback(() => {immediateRef.current=null;},[]);

  const updateMessages = useCallback((next: Message[]) => {
    immediateRef.current=null;
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
  }, [compilation,setPreparing]);

  const prepareQueue = useCallback(async (onlyDrafts = false, immediate?:ImmediatePreparation) => {
    const lab = labRef.current;
    if (!lab || preparingRef.current || lab.world.won || lab.world.timedOut || lab.isAbsorbing) return;
    const pending = messageRef.current.filter(message => immediate ? message.id===immediate.id && message.status!=='sent'
      : onlyDrafts ? message.status === 'draft' : message.status !== 'sent');
    if (!pending.length) return;
    const ticket = compilation.begin();
    if (!ticket) return;
    immediateRef.current=immediate?ticket:null;
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
      let preview = lab.world.rules;
      const bounded = result.messages.map(message => {
        const limited = limitAbsoluteOperations(message.operations,context);
        preview = applyRules(preview,limited.operations,context);
        const adjustments = [...new Map([...(message.adjustments || []),...limited.adjustments]
          .map(item => [JSON.stringify(item),item])).values()];
        return {...message,operations:limited.operations,adjustments};
      });
      const compiled = new Map(bounded.map(message => [message.id, message]));
      const applyImmediately=immediate && immediateRef.current===ticket;
      updateMessages(messageRef.current.map(message => compiled.has(message.id) ? {
        id: message.id, text: message.text, status: 'ready', operations: compiled.get(message.id)!.operations,
        understoodAs: compiled.get(message.id)!.understoodAs, adjustments: compiled.get(message.id)!.adjustments, source: 'ai',
      } : message));
      if(applyImmediately)immediate.onReady([immediate.id]);
      else onNotice('Ready when you are.');
    } catch (error) {
      if (!compilation.isCurrent(ticket)) return;
      const reason = error instanceof Error ? error.message : 'Could not read this rule. Edit it and try again.';
      const failed = new Set(pending.filter(message => message.status === 'draft').map(message => message.id));
      if (failed.size) updateMessages(messageRef.current.map(message => (
        failed.has(message.id) ? { ...message, status: 'error', error: reason } : message
      )));
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
    if (api.configured && !preparing && messages.some(message => message.status === 'draft')) void prepareQueue(true);
  }, [messages, api.configured, preparing, prepareQueue]);

  useEffect(() => {
    if (api.configured && messageRef.current.some(message => message.status === 'error' && message.requiresAI)) {
      updateMessages(messageRef.current.map(message => message.status === 'error' && message.requiresAI
        ? { ...message, status: 'draft', error: undefined } : message));
    }
  }, [api.configured, updateMessages]);

  return { messages, messageRef, api, preparing, storageAvailable, updateMessages, localMessage, prepareQueue, invalidateScene,
    cancelImmediate,isPreparing:()=>preparingRef.current };
}
