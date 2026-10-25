import { failedCompilationMessage, validateCompiledOperations, type CompilationMessage } from '../../../shared/compilation-message';
import type { RuleContext, RuleState } from '../../../shared/rules';
import type { Message } from './queue';

/** Recheck each successful result against the current scene, then merge by ID. */
export function mergeCompilationResults(messages: readonly Message[], results: readonly CompilationMessage[], current: RuleState, context: RuleContext) {
  let preview = current;
  const checked = results.map(result => {
    if ('error' in result) return result;
    try {
      const limited = validateCompiledOperations(preview, result.operations, context);
      preview = limited.state;
      const adjustments = [...new Map([...(result.adjustments || []), ...limited.adjustments]
        .map(item => [JSON.stringify(item), item])).values()];
      return { ...result, operations: limited.operations, adjustments };
    } catch (error) {
      return failedCompilationMessage(result.id, error);
    }
  });
  const byId = new Map(checked.map(result => [result.id, result]));
  const next = messages.map((message): Message => {
    const result = byId.get(message.id);
    if (!result || message.status === 'sent') return message;
    if ('error' in result) return { id: message.id, text: message.text, status: 'error', error: result.error, source: 'ai' };
    return { id: message.id, text: message.text, status: 'ready', operations: result.operations,
      understoodAs: result.understoodAs, adjustments: result.adjustments, source: 'ai' };
  });
  const readyIds = next.filter(message => byId.has(message.id) && message.status === 'ready').map(message => message.id);
  const failed = checked.filter(result => 'error' in result).length;
  return { messages: next, readyIds, notice: failed ? `${readyIds.length} ready · ${failed} ${failed === 1 ? 'needs' : 'need'} editing.` : 'Ready when you are.' };
}
