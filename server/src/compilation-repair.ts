import { validateCompilation, validateModelIdentity, type CompileRequest } from '../../shared/compiler';
import { failedCompilationMessage, ModelMessageSchema } from '../../shared/compilation-message';
import type { RuleContext } from '../../shared/rules';
import type { RepairConversation } from './ai-client';
import { CompilerError } from './ai-client';
import { withCompilationSignal } from './compilation-budget';
import { describeOperation } from '../../shared/commands';
import { AI_REVIEW_PREFIX } from '../../shared/ai-review';

export const REPAIR_INSTRUCTION = `Review the previous compilation using the validator feedback below. The meaning checker can be wrong: decide the player's intended interpretation using the original message and scene. Return your final interpretation ONLY for the requested failed message IDs, in their original order. Other rows are already Ready and must not be changed. Preserve the player's numbers, scope, negation and intended arithmetic. Use the same operation schema and scene capabilities. Your revised executable rules will be shown to the player for review before Send now, without another meaning-heuristic rejection. If the intent cannot be represented, return a clear error rather than inventing a different instruction. Do not execute anything.`;

type Compilation = ReturnType<typeof validateCompilation>;
type Repair = (conversation: RepairConversation) => Promise<unknown>;

/** One corrective turn for validator failures; explicit model refusals stay put. */
export async function repairCompilation(request: CompileRequest, output: unknown, first: Compilation, context: RuleContext,
  repair: Repair, deadline: AbortSignal, caller?: AbortSignal): Promise<Compilation> {
  const original = validateModelIdentity(request, output);
  const indices = first.messages.flatMap((message, index) => {
    const candidate = original.messages[index];
    const explicitError = typeof candidate.error === 'string' && candidate.error.trim();
    return 'error' in message && !explicitError ? [index] : [];
  });
  if (!indices.length || deadline.aborted) return first;
  const failed = indices.map(index => {
    const schema = ModelMessageSchema.safeParse(original.messages[index]);
    return { ...request.messages[index], reason: 'error' in first.messages[index] ? first.messages[index].error : '',
      ...(!schema.success ? { issues: schema.error.issues.slice(0, 8).map(({ code, path, message }) => ({ code, path, message })) } : {}),
    };
  });
  const subset = { messages: indices.map(index => request.messages[index]) };
  console.info(JSON.stringify({ event: 'compiler_repair_started', requestId: request.requestId, rows: indices.length }));
  try {
    const response = await withCompilationSignal(deadline, () => repair({ previousReply: output,
      feedback: REPAIR_INSTRUCTION + '\n' + JSON.stringify({ messages: failed }),
    }), caller);
    if (caller?.aborted) throw new CompilerError('Preparation cancelled.', 499);
    const corrected = validateModelIdentity(subset, response);
    const replacements = new Map(corrected.messages.map(message => [message.id, message]));
    const checked = validateCompilation(request, { messages: original.messages.map(message => replacements.get(message.id) ?? message) }, context, false);
    // A repaired trigger must not consume capacity that an existing Ready row
    // needs. Reject that repair set instead of downgrading previously valid work.
    const conflict = first.messages.some((message, index) => !('error' in message) && 'error' in checked.messages[index]);
    const messages = first.messages.map((message, index) => {
      if (!indices.includes(index)) return message;
      if (conflict) return failedCompilationMessage(message.id, 'The repair conflicted with an already Ready rule. Your world is unchanged.');
      const result = checked.messages[index];
      return 'error' in result ? failedCompilationMessage(result.id, `The AI revision cannot run in this scene: ${result.error}`)
        : { ...result, understoodAs: (AI_REVIEW_PREFIX + result.operations.map(operation => describeOperation(operation).title).join('; ')).slice(0, 240) };
    });
    console.info(JSON.stringify({ event: 'compiler_repair_finished', requestId: request.requestId, repaired: indices.filter(index => !('error' in messages[index])).length, attempted: indices.length }));
    return { ...first, messages };
  } catch (error) {
    if (caller?.aborted) throw new CompilerError('Preparation cancelled.', 499);
    console.warn(JSON.stringify({ event: 'compiler_repair_failed', requestId: request.requestId, reason: deadline.aborted ? 'deadline' : 'unusable_response' }));
    return first;
  }
}
