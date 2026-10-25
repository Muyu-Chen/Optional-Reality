import { z } from 'zod';

export interface AiProviderConfig {
  provider: 'compatible' | 'gemini';
  apiKeyEnv: 'AI_API_KEY' | 'GEMINI_API_KEY';
  baseUrl: string; model: string; apiKey: string;
  format: 'json_object' | 'json_schema' | 'text'; timeoutMs: number;
  thinking: 'disabled' | 'enabled' | 'omit';
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high' | 'omit';
}
export interface AiConfig extends AiProviderConfig {
  fallback?: AiProviderConfig;
  primaryTimeoutMs?: number;
}
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const provider = z.enum(['compatible', 'gemini']).parse(env.AI_PROVIDER?.trim() || 'compatible');
  const primary = providerConfig(provider, env);
  const fallback = z.enum(['none', 'deepseek']).parse(env.AI_FALLBACK_PROVIDER?.trim() || 'none');
  if (provider !== 'gemini' || fallback === 'none') return primary;
  const backup = providerConfig('compatible', env);
  if (new URL(backup.baseUrl).origin !== 'https://api.deepseek.com') throw new Error('DeepSeek fallback requires AI_BASE_URL=https://api.deepseek.com (optionally with /v1).');
  return { ...primary, fallback: backup,
    primaryTimeoutMs: z.coerce.number().int().min(100).max(120000).parse(env.AI_PRIMARY_TIMEOUT_MS || 8000),
  };
}

function providerConfig(provider: AiProviderConfig['provider'], env: NodeJS.ProcessEnv): AiProviderConfig {
  const gemini = provider === 'gemini';
  const baseName = gemini ? 'GEMINI_BASE_URL' : 'AI_BASE_URL';
  const baseUrl = (env[baseName]?.trim() || (gemini ? 'https://generativelanguage.googleapis.com/v1beta/openai' : 'https://api.deepseek.com')).replace(/\/+$/, '');
  const url = new URL(baseUrl);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(`${baseName} must be an HTTP(S) API base URL without credentials, query, or fragment.`);
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Use HTTPS for remote model providers.');
  const apiKeyEnv = gemini ? 'GEMINI_API_KEY' : 'AI_API_KEY';
  return {
    provider, apiKeyEnv, baseUrl,
    model: (gemini ? env.GEMINI_MODEL?.trim() : env.AI_MODEL?.trim()) || (gemini ? 'gemini-3.1-flash-lite' : 'deepseek-flash'),
    // Each provider always uses its own credentials and endpoint.
    apiKey: env[apiKeyEnv]?.trim() || '',
    format: z.enum(['json_object', 'json_schema', 'text']).parse((gemini ? env.GEMINI_RESPONSE_FORMAT : env.AI_RESPONSE_FORMAT) || 'json_object'),
    timeoutMs: z.coerce.number().int().min(100).max(120000).parse(env.AI_TIMEOUT_MS || 30000),
    thinking: gemini ? 'omit' : z.enum(['disabled', 'enabled', 'omit']).parse(env.AI_THINKING || 'disabled'),
    reasoningEffort: gemini ? z.enum(['minimal', 'low', 'medium', 'high', 'omit']).parse(env.GEMINI_REASONING_EFFORT || 'minimal') : 'omit',
  };
}
