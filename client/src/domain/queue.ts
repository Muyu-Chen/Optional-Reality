import { parseCommand, type Operation } from '../../../shared/commands';
import { applyRules, GRAVITY_CONTEXT, gravityState, type RuleContext, type RuleState } from '../../../shared/rules';

export interface Message {
  id: string; text: string; status: 'draft' | 'ready' | 'error' | 'sent';
  operation?: Operation; operations?: Operation[]; error?: string; source?: 'local' | 'ai';
}
export interface AppliedEvent { id: string; text: string; tick: number; gravity: number; operations: Operation[] }
export const messageOperations = (message: Message) => message.operations || (message.operation ? [message.operation] : []);
export function prepareMessage(id: string, text: string, context?: RuleContext, rules?: RuleState): Message {
  const parsed = parseCommand(text, context);
  if (!parsed.operation) return { id, text: text.trim(), status: 'error', error: parsed.error };
  try {
    if (context && rules) applyRules(rules, [parsed.operation], context);
    return { id, text: text.trim(), status: 'ready', operation: parsed.operation, source: 'local' };
  } catch (error) { return { id, text: text.trim(), status: 'error', error: error instanceof Error ? error.message : 'Invalid command.' }; }
}

// Validate the entire batch before returning any new world or queue state.
export function applyBatch(messages: Message[], ids: string[], current: number | RuleState, tick: number, context: RuleContext = GRAVITY_CONTEXT) {
  if (!ids.length) throw new Error('Select at least one ready message.');
  if (new Set(ids).size !== ids.length) throw new Error('A message can only be sent once in a batch.');
  const selected = messages.filter(message => ids.includes(message.id));
  if (selected.length !== ids.length) throw new Error('A selected message no longer exists.');
  let rules = typeof current === 'number' ? gravityState(current) : current;
  const events: AppliedEvent[] = [];
  for (const message of selected) {
    const operations = messageOperations(message);
    if (message.status !== 'ready' || !operations.length) throw new Error('Only ready messages can be sent.');
    rules = applyRules(rules, operations, context);
    events.push({ id: message.id, text: message.text, tick, gravity: rules.gravity, operations });
  }
  return { gravity: rules.gravity, rules, events,
    messages: messages.map(message => ids.includes(message.id) ? { ...message, status: 'sent' as const } : message),
  };
}
