import { applyOperation, parseCommand, type Operation } from '../../../shared/commands';

export interface Message {
  id: string;
  text: string;
  status: 'ready' | 'error' | 'sent';
  operation?: Operation;
  error?: string;
}
export interface AppliedEvent {
  id: string;
  text: string;
  tick: number;
  gravity: number;
}

export function prepareMessage(id: string, text: string): Message {
  const parsed = parseCommand(text);
  return parsed.operation
    ? { id, text: text.trim(), status: 'ready', operation: parsed.operation }
    : { id, text: text.trim(), status: 'error', error: parsed.error };
}

// Validate the entire batch before returning any new world or queue state.
export function applyBatch(messages: Message[], ids: string[], currentGravity: number, tick: number) {
  if (!ids.length) throw new Error('Select at least one ready message.');
  if (new Set(ids).size !== ids.length) throw new Error('A message can only be sent once in a batch.');
  const selected = messages.filter(message => ids.includes(message.id));
  if (selected.length !== ids.length) throw new Error('A selected message no longer exists.');
  let gravity = currentGravity;
  const events: AppliedEvent[] = [];
  for (const message of selected) {
    if (message.status !== 'ready' || !message.operation) throw new Error('Only ready messages can be sent.');
    gravity = applyOperation(gravity, message.operation);
    events.push({ id: message.id, text: message.text, tick, gravity });
  }
  return {
    gravity,
    events,
    messages: messages.map(message => ids.includes(message.id) ? { ...message, status: 'sent' as const } : message),
  };
}
