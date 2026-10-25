import { z } from 'zod';
import { ModelOutputSchema } from '../../shared/compiler';
import type { AiProviderConfig } from './config';

export class CompilerError extends Error {
  constructor(message: string, readonly status = 502, readonly upstreamStatus?: number) { super(message); }
}
export async function requestJson(config: AiProviderConfig, system: string, user: string, signal?: AbortSignal, fetcher: typeof fetch = fetch) {
  if (!config.apiKey) throw new CompilerError(`Add ${config.apiKeyEnv} to the server .env file and restart the API server.`, 503);
  const responseFormat = config.format === 'json_schema'
    ? { type: 'json_schema', json_schema: { name: 'physics_commands', strict: true, schema: z.toJSONSchema(ModelOutputSchema) } }
    : config.format === 'json_object' ? { type: 'json_object' } : undefined;
  let text: string;
  try {
    const response = await fetcher(`${config.baseUrl}/chat/completions`, {
      method: 'POST', redirect: 'error',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        stream: false, max_tokens: 4096, temperature: .1, response_format: responseFormat,
        ...(config.thinking !== 'omit' && new URL(config.baseUrl).hostname === 'api.deepseek.com' ? { thinking: { type: config.thinking } } : {}),
        ...(config.provider === 'gemini' && config.reasoningEffort !== 'omit' ? { reasoning_effort: config.reasoningEffort } : {}),
      }),
      signal: AbortSignal.any([AbortSignal.timeout(config.timeoutMs), ...(signal ? [signal] : [])]),
    });
    if (!response.ok) throw new CompilerError(response.status === 401 || response.status === 403
      ? `The provider rejected the server API key. Check ${config.apiKeyEnv}.`
      : response.status === 429 ? 'The provider rate limit was reached. Try again later.' : `The model provider returned HTTP ${response.status}.`, 502, response.status);
    text = await response.text();
  } catch (error) {
    if (error instanceof CompilerError) throw error;
    if (signal?.aborted) throw new CompilerError('Preparation cancelled.', 499);
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new CompilerError('The model request timed out. Your messages and current rules are unchanged.', 504);
    throw new CompilerError('Could not reach the model provider. Check the server API configuration.');
  }
  if (text.length > 100000) throw new CompilerError('The model response exceeded the allowed size.');
  let envelope: unknown;
  try { envelope = JSON.parse(text); } catch { throw new CompilerError('The provider returned invalid JSON.'); }
  const parsed = z.object({ choices: z.array(z.object({ finish_reason: z.string(), message: z.object({ content: z.string().nullable(), refusal: z.string().nullable().optional() }) })).min(1) }).safeParse(envelope);
  if (!parsed.success) throw new CompilerError('The provider response did not match the Chat Completions format.');
  const choice = parsed.data.choices[0];
  if (choice.message.refusal || choice.finish_reason !== 'stop' || !choice.message.content) throw new CompilerError('The model did not return a complete rule compilation.');
  try { return JSON.parse(choice.message.content); } catch { throw new CompilerError('The model returned invalid rule JSON. No new rules were prepared.'); }
}
