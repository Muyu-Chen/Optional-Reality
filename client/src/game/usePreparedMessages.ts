import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { applyRules } from '../../../shared/rules';
import { compilerStatus, prepareWithAI } from '../api/compiler';
import { CompilationSession } from '../api/compilation-session';
import { loadMessages, messageStorageKey } from '../domain/message-storage';
import { prepareMessage, type Message } from '../domain/queue';
import { initialRules, ruleContext } from '../levels/rules';
import type { LevelDefinition } from '../levels/types';
import type { CanvasLab } from '../physics/canvas-lab';

// Owns preparation and persistence only. Sending a prepared rule belongs to the game session.
export function usePreparedMessages(level: LevelDefinition, labRef: RefObject<CanvasLab | null>, onNotice: (text: string) => void) {
  const context = useMemo(() => ruleContext(level), [level]);
  const [messages, setMessages] = useState(() => loadMessages(level));
  const messageRef = useRef(messages);
  const [compilation] = useState(() => new CompilationSession());
  const [api, setApi] = useState({ configured: false, model: '' });
  const [preparing, setPreparing] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const updateMessages = useCallback((next: Message[]) => {
    compilation.queueChanged();
    setPreparing(false);
    messageRef.current = next;
    setMessages(next);
  }, [compilation]);

  const localMessage = useCallback((messageId: string, text: string) => (
    prepareMessage(messageId, text, context, initialRules(level))
  ), [context, level]);

  const invalidateScene = useCallback(() => {
    compilation.sceneChanged();
    setPreparing(false);
  }, [compilation]);

  const prepareQueue = useCallback(async (onlyDrafts = false) => {
    const lab = labRef.current;
    if (!lab || preparing) return;
    const pending = messageRef.current.filter(message => onlyDrafts ? message.status === 'draft' : message.status !== 'sent');
    if (!pending.length) return;
    const ticket = compilation.begin();
    if (!ticket) return;
    lab.world.pause();
    lab.report();
    setPreparing(true);
    const request = {
      requestId: crypto.randomUUID(), levelId: level.id,
      sceneVersion: ticket.sceneVersion, queueRevision: ticket.queueRevision,
      messages: pending.map(({ id, text }) => ({ id, text })), rules: structuredClone(lab.world.rules),
    };
    onNotice('Preparing messages with AI. The experiment is paused; rules stay unchanged.');
    try {
      const result = await prepareWithAI(request, ticket.signal);
      if (!compilation.isCurrent(ticket)) return;
      let preview = lab.world.rules;
      for (const message of result.messages) preview = applyRules(preview, message.operations, context);
      const compiled = new Map(result.messages.map(message => [message.id, message.operations]));
      updateMessages(messageRef.current.map(message => compiled.has(message.id) ? {
        id: message.id, text: message.text, status: 'ready', operations: compiled.get(message.id), source: 'ai',
      } : message));
      onNotice('AI preparation complete. Review the parsed rules, then send when ready. The experiment remains paused.');
    } catch (error) {
      if (!compilation.isCurrent(ticket)) return;
      const reason = error instanceof Error ? error.message : 'AI preparation failed. Edit the message and try again.';
      const failed = new Set(pending.filter(message => message.status === 'draft').map(message => message.id));
      if (failed.size) updateMessages(messageRef.current.map(message => (
        failed.has(message.id) ? { ...message, status: 'error', error: reason } : message
      )));
      onNotice(reason);
    } finally {
      if (compilation.finish(ticket)) setPreparing(false);
    }
  }, [labRef, preparing, compilation, level, context, updateMessages, onNotice]);

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

  return { messages, messageRef, api, preparing, storageAvailable, updateMessages, localMessage, prepareQueue, invalidateScene };
}
