import { z } from 'zod';

export interface AiConfig { baseUrl: string; model: string; apiKey: string; format: 'json_object' | 'json_schema' | 'text'; timeoutMs: number; thinking: 'disabled' | 'enabled' | 'omit' }
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const baseUrl = (env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
  const url = new URL(baseUrl);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('AI_BASE_URL must be an HTTP(S) API base URL without credentials, query, or fragment.');
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Use HTTPS for remote model providers.');
  return {
    baseUrl, model: env.AI_MODEL?.trim() || 'deepseek-flash', apiKey: env.AI_API_KEY?.trim() || '',
    format: z.enum(['json_object', 'json_schema', 'text']).parse(env.AI_RESPONSE_FORMAT || 'json_object'),
    timeoutMs: z.coerce.number().int().min(100).max(120000).parse(env.AI_TIMEOUT_MS || 30000),
    thinking: z.enum(['disabled', 'enabled', 'omit']).parse(env.AI_THINKING || 'disabled'),
  };
}
