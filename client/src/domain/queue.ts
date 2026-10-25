import { parseCommand, type Operation } from '../../../shared/commands';
import { normalizeCommand } from '../../../shared/command-language';
import { limitAbsoluteOperation, type RuleAdjustment } from '../../../shared/rule-limits';
import { applyRules, GRAVITY_CONTEXT, gravityState, type RuleContext, type RuleState } from '../../../shared/rules';

export interface Message {
  id: string; text: string; status: 'draft' | 'ready' | 'error' | 'sent';
  operation?: Operation; operations?: Operation[]; error?: string; source?: 'local' | 'ai'; requiresAI?: boolean;
  understoodAs?: string;
  adjustments?: RuleAdjustment[];
}
export interface AppliedEvent { id: string; text: string; tick: number; acceleration: RuleState['acceleration']; operations: Operation[]; understoodAs?: string; adjustments?: RuleAdjustment[] }
export const messageOperations = (message: Message) => message.operations || (message.operation ? [message.operation] : []);
export function prepareMessage(id: string, text: string, context?: RuleContext, rules?: RuleState): Message {
  const parsed = parseCommand(text, context);
  if (!parsed.operation) return { id, text: text.trim(), status: 'error', error: parsed.error, requiresAI: true };
  try {
    const limited = context ? limitAbsoluteOperation(parsed.operation,context) : { operation: parsed.operation };
    if (context && rules) applyRules(rules, [limited.operation], context);
    const normalized = normalizeCommand(text);
    return { id, text: text.trim(), status: 'ready', operation: limited.operation, source: 'local',
      ...(normalized !== text.trim() ? { understoodAs: normalized } : {}),
      ...(limited.adjustment ? { adjustments: [limited.adjustment] } : {}),
    };
  } catch (error) { return { id, text: text.trim(), status: 'error', error: error instanceof Error ? error.message : 'Invalid command.' }; }
}

export function retryMessages(messages: readonly Message[]): Message[] {
  return messages.map(message => messageOperations(message).length ? {...message,status:'ready',error:undefined} : {...message});
}
export const nextMessage = (messages: readonly Message[]) => messages.find(message => message.status !== 'sent');

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
    events.push({ id: message.id, text: message.text, tick, acceleration: {...rules.acceleration}, operations,
      ...(message.understoodAs ? { understoodAs: message.understoodAs } : {}),
      ...(message.adjustments ? { adjustments: message.adjustments } : {}),
    });
  }
  return { acceleration: {...rules.acceleration}, rules, events,
    messages: messages.map(message => ids.includes(message.id) ? { ...message, status: 'sent' as const } : message),
  };
}
