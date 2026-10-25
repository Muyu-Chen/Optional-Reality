import { CompileResponseSchema, type CompileRequest } from '../../../shared/compiler';
import { withRequestDeadline } from './request-deadline';
import { ARITHMETIC_HEADER, ARITHMETIC_VERSION } from '../../../shared/arithmetic-protocol';
import { AI_REVIEW_HEADER, AI_REVIEW_VERSION } from '../../../shared/ai-review';
import { COMPILER_PROTOCOL, COMPILER_PROTOCOL_HEADER } from '../../../shared/compiler-protocol';

export async function compilerStatus(signal: AbortSignal): Promise<{ configured: boolean; model: string }> {
  const response = await fetch('/api/status', { signal });
  if (!response.ok) return { configured: false, model: '' };
  const result = await response.json();
  return { configured: result.configured === true, model: typeof result.model === 'string' ? result.model : '' };
}
export async function prepareWithAI(request: CompileRequest, signal: AbortSignal) {
  return withRequestDeadline(async requestSignal => {
  const response = await fetch('/api/compile', {
    method: 'POST', headers: { 'content-type': 'application/json', [COMPILER_PROTOCOL_HEADER]: COMPILER_PROTOCOL, [ARITHMETIC_HEADER]: ARITHMETIC_VERSION, [AI_REVIEW_HEADER]: AI_REVIEW_VERSION }, body: JSON.stringify(request), signal: requestSignal,
  });
  let output: unknown;
  try { output = await response.json(); } catch { throw new Error('The API server is unavailable. Start it with npm run dev or npm start.'); }
  if (!response.ok) {
    const error = typeof output === 'object' && output !== null && 'error' in output && typeof output.error === 'string' ? output.error : 'Could not read this rule. Please try again.';
    throw new Error(error);
  }
  const result = CompileResponseSchema.parse(output);
  if (result.requestId !== request.requestId || result.levelId !== request.levelId || result.queueRevision !== request.queueRevision || result.sceneVersion !== request.sceneVersion) throw new Error('An outdated compilation was ignored.');
  if (result.messages.length !== request.messages.length || result.messages.some((message, index) => message.id !== request.messages[index].id)) throw new Error('The compiler returned mismatched message IDs.');
  return result;
  }, signal);
}
