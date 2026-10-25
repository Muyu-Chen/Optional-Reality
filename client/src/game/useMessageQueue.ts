import { useCallback, useRef, useState, type RefObject } from 'react';
import type { Message } from '../domain/queue';
import type { LevelDefinition } from '../levels/types';
import type { CanvasLab } from '../physics/canvas-lab';
import { usePreparedMessages } from './usePreparedMessages';

export function useMessageQueue(level: LevelDefinition, labRef: RefObject<CanvasLab | null>, onNotice: (text: string) => void) {
  const prepared = usePreparedMessages(level, labRef, onNotice);
  const { messageRef, updateMessages, localMessage, api } = prepared;
  const [input, setInputState] = useState('');
  const inputRef = useRef('');
  const setInput = useCallback((text:string) => {inputRef.current=text;setInputState(text);},[]);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [managing, setManaging] = useState(false);

  function clearSelection(ids?: string[]) {
    setSelected(previous => ids ? new Set([...previous].filter(value => !ids.includes(value))) : new Set());
  }

  function toggleSelection(messageId: string) {
    setSelected(previous => {
      const next = new Set(previous);
      next.has(messageId) ? next.delete(messageId) : next.add(messageId);
      return next;
    });
  }

  function cancelEditing() {
    setEditing(null);
    setInput('');
  }

  function editMessage(message: Message) {
    prepared.cancelImmediate();
    setEditing(message.id);
    setInput(message.text);
  }

  function storeInput() {
    const text = inputRef.current.trim();
    if (!text) return null;
    if (!editing && messageRef.current.length >= 24) {
      onNotice('The demo holds 24 messages. Remove a message to add another.');
      return null;
    }
    const entry = localMessage(editing || crypto.randomUUID(), text);
    updateMessages(editing
      ? messageRef.current.map(message => message.id === editing ? entry : message)
      : [...messageRef.current, entry]);
    if (editing) clearSelection([editing]);
    cancelEditing();
    return entry;
  }

  function queueMessage() {
    if (labRef.current?.isAbsorbing) return;
    const entry=storeInput();
    if(!entry)return;
    onNotice(entry.status === 'ready' ? 'Message queued. Choose Send now when ready.'
      : api.configured ? 'Interpreting your message…' : 'Saved. Connect the AI service or use a starter command.');
  }

  function applyCurrent(onSend:(ids:string[])=>void) {
    const lab=labRef.current;
    if(!lab || lab.world.won || lab.world.timedOut || lab.isAbsorbing || prepared.isPreparing())return;
    const entry=storeInput();
    if(!entry)return;
    if(entry.status==='ready')onSend([entry.id]);
    else if(entry.status==='draft' && api.configured)void prepared.prepareQueue({draftsOnly:true,messageId:entry.id,onReady:onSend});
    else onNotice(entry.error || 'This message needs editing before it can be applied.');
  }

  function removeMessage(messageId: string) {
    updateMessages(messageRef.current.filter(message => message.id !== messageId));
    clearSelection([messageId]);
    if (editing === messageId) cancelEditing();
  }

  function moveMessage(messageId: string, direction: -1 | 1) {
    const next = [...messageRef.current];
    const pending = next.map((message, index) => message.status !== 'sent' ? index : -1).filter(index => index >= 0);
    const from = next.findIndex(message => message.id === messageId);
    const position = pending.indexOf(from);
    if (position < 0) return;
    const to = pending[position + direction];
    if (to === undefined) return;
    [next[from], next[to]] = [next[to], next[from]];
    updateMessages(next);
  }

  function loadExample() {
    updateMessages(level.instructions.exampleMessages.map(text => localMessage(crypto.randomUUID(), text)));
    clearSelection();
    cancelEditing();
    onNotice(level.instructions.exampleNotice);
  }

  function queueAgain(text: string) {
    if (messageRef.current.length >= 24) return;
    updateMessages([...messageRef.current, localMessage(crypto.randomUUID(), text)]);
  }

  function clearMessages() {
    updateMessages([]);
    clearSelection();
    cancelEditing();
  }

  function toggleManaging() {
    setManaging(!managing);
    clearSelection();
  }

  return {
    ...prepared, input, editing, selected, managing, setInput, clearSelection, toggleSelection,
    selectMessages: (ids: string[]) => setSelected(new Set(ids)),
    cancelEditing, editMessage, queueMessage, applyCurrent, removeMessage, moveMessage,
    loadExample, queueAgain, clearMessages, toggleManaging,
  };
}
