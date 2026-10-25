import type { validateCompilation } from '../../shared/compiler';
import { failedCompilationMessage } from '../../shared/compilation-message';
import { needsAIReview } from '../../shared/ai-review';

export function reviewForClient(result: ReturnType<typeof validateCompilation>, supported: boolean) {
  if (supported) return result;
  return { ...result, messages: result.messages.map(message => !('error' in message) && needsAIReview(message)
    ? failedCompilationMessage(message.id, 'AI revised this interpretation. Refresh the page to review it before sending.') : message) };
}
