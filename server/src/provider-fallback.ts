import { CompilerError } from './ai-client';
import type { AiConfig, AiProviderConfig } from './config';

function aborted(signal?: AbortSignal) {
  return signal?.aborted ? new CompilerError('Preparation cancelled.', 499)
    : new CompilerError('The model request timed out. Your messages and current rules are unchanged.', 504);
}

// Bound the whole attempt, including a stalled body or a provider ignoring abort.
async function attempt<T>(provider: AiProviderConfig, signal: AbortSignal, run: (provider: AiProviderConfig, signal: AbortSignal) => Promise<T>): Promise<T> {
  if (signal.aborted) throw aborted();
  let onAbort = () => {};
  const deadline = new Promise<never>((_, reject) => {
    onAbort = () => reject(aborted());
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try { return await Promise.race([run(provider, signal), deadline]); }
  finally { signal.removeEventListener('abort', onAbort); }
}

/** One Gemini attempt, then at most one independently configured DeepSeek attempt. */
export async function withProviderFallback<T>(config: AiConfig, run: (provider: AiProviderConfig, signal: AbortSignal) => Promise<T>, signal?: AbortSignal, requestId?: string): Promise<T> {
  if (signal?.aborted) throw aborted(signal);
  const total = AbortSignal.any([AbortSignal.timeout(config.timeoutMs), ...(signal ? [signal] : [])]);
  const fallback = config.provider === 'gemini' && config.fallback?.apiKey ? config.fallback : undefined;
  const primarySignal = fallback ? AbortSignal.any([total, AbortSignal.timeout(config.primaryTimeoutMs ?? 8000)]) : total;
  const start = Date.now();
  try {
    const result = await attempt(config, primarySignal, run);
    console.info(JSON.stringify({ event: 'compiler_provider_success', requestId, provider: config.provider, elapsedMs: Date.now() - start }));
    return result;
  } catch (error) {
    if (signal?.aborted) throw aborted(signal);
    console.warn(JSON.stringify({ event: 'compiler_provider_failed', requestId, provider: config.provider,
      reason: error instanceof CompilerError ? 'provider_error' : 'invalid_output', status: error instanceof CompilerError ? error.status : 422,
      upstreamStatus: error instanceof CompilerError ? error.upstreamStatus : undefined,
      elapsedMs: Date.now() - start, fallback: !!fallback && !total.aborted }));
    if (total.aborted) throw aborted();
    if (!fallback) throw error;
  }
  try {
    const result = await attempt(fallback, total, run);
    console.info(JSON.stringify({ event: 'compiler_provider_success', requestId, provider: 'deepseek', elapsedMs: Date.now() - start, fallback: true }));
    return result;
  } catch (error) {
    if (signal?.aborted) throw aborted(signal);
    console.warn(JSON.stringify({ event: 'compiler_provider_failed', requestId, provider: 'deepseek', fallback: true,
      status: error instanceof CompilerError ? error.status : 422, upstreamStatus: error instanceof CompilerError ? error.upstreamStatus : undefined, elapsedMs: Date.now() - start }));
    throw new CompilerError('Gemini and DeepSeek could not prepare the rules. Try again shortly.', total.aborted || (error instanceof CompilerError && error.status === 504) ? 504 : 502);
  }
}
