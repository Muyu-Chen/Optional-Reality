import { afterEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { loadConfig } from './config';
import { requestJson } from './ai-client';
import { compileRules } from './compiler';
import { createApp } from './app';
import { initialRules } from '../../client/src/levels/rules';
import { bounce } from '../../client/src/levels/bounce';

const keys = { AI_API_KEY: 'retained-deepseek-test-key', GEMINI_API_KEY: 'separate-google-test-key' };
const gemini = () => loadConfig({ ...keys, AI_PROVIDER: 'gemini' });
const operations = [{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -1 }];
const output = { messages: [{ id: 'm1', operations, error: null }] };
const reply = (body = output) => vi.fn<typeof fetch>().mockImplementation(async () => Response.json({
  choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(body) } }],
}));
const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

describe('independent Gemini configuration and compatible requests', () => {
  it('switches profiles without overwriting settings or reusing another provider key', () => {
    const env = Object.freeze({ ...keys, AI_MODEL: 'retained-model', AI_BASE_URL: 'https://api.deepseek.com' });
    expect(loadConfig(env)).toMatchObject({ provider: 'compatible', apiKey: keys.AI_API_KEY, model: 'retained-model' });
    expect(loadConfig({ ...env, AI_PROVIDER: 'gemini' })).toMatchObject({
      provider: 'gemini', apiKeyEnv: 'GEMINI_API_KEY', apiKey: keys.GEMINI_API_KEY,
      model: 'gemini-3.1-flash-lite', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      thinking: 'omit', reasoningEffort: 'minimal', format: 'json_object',
    });
    expect(loadConfig(env).apiKey).toBe(keys.AI_API_KEY);
    expect(env).toEqual({ ...keys, AI_MODEL: 'retained-model', AI_BASE_URL: 'https://api.deepseek.com' });
  });

  it('sends Google credentials and JSON instructions to the exact compatibility endpoint', async () => {
    const fetcher = reply();await requestJson(gemini(), 'Return JSON only.', '{}', undefined, fetcher);
    const [url, init] = fetcher.mock.calls[0];const body = JSON.parse(String(init!.body));
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
    expect(init!.headers).toMatchObject({ authorization: `Bearer ${keys.GEMINI_API_KEY}` });
    expect(JSON.stringify(init)).not.toContain(keys.AI_API_KEY);
    expect(body).toMatchObject({ model: 'gemini-3.1-flash-lite', reasoning_effort: 'minimal', response_format: { type: 'json_object' }, stream: false });
    expect(body.thinking).toBeUndefined();expect(init!.redirect).toBe('error');
  });

  it('uses Gemini overrides independently and can omit reasoning controls', async () => {
    const config = loadConfig({ ...keys, AI_PROVIDER: 'gemini', GEMINI_MODEL: 'chosen-gemini-model',
      GEMINI_BASE_URL: 'https://gemini.example/openai/', GEMINI_RESPONSE_FORMAT: 'text', GEMINI_REASONING_EFFORT: 'omit',
      AI_BASE_URL: 'not-a-url', AI_RESPONSE_FORMAT: 'unused', AI_THINKING: 'unused' });
    const fetcher = reply();await requestJson(config, 'JSON', '{}', undefined, fetcher);
    const body = JSON.parse(String(fetcher.mock.calls[0][1]!.body));
    expect(config.model).toBe('chosen-gemini-model');expect(config.baseUrl).toBe('https://gemini.example/openai');
    expect(body.reasoning_effort).toBeUndefined();expect(body.response_format).toBeUndefined();
  });

  it('does not call a provider or fall back to the retained key when the selected key is absent', async () => {
    const config = loadConfig({ AI_PROVIDER: 'gemini', AI_API_KEY: keys.AI_API_KEY });const fetcher = reply();
    await expect(requestJson(config, 'JSON', '{}', undefined, fetcher)).rejects.toMatchObject({ status: 503 });
    await expect(requestJson(config, 'JSON', '{}', undefined, fetcher)).rejects.toThrow('GEMINI_API_KEY');
    expect(fetcher).not.toHaveBeenCalled();expect(config.apiKey).toBe('');
  });

  it('reports the active key name on authentication failure without provider diagnostics or saved keys', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('PRIVATE_GOOGLE_BODY', { status: 403 }));
    const promise = requestJson(gemini(), 'JSON', '{}', undefined, fetcher);
    await expect(promise).rejects.toThrow('GEMINI_API_KEY');
    for (const privateValue of ['PRIVATE_GOOGLE_BODY', ...Object.values(keys)]) await expect(promise).rejects.not.toThrow(privateValue);
  });

  it('applies the existing schema and scene permissions to Gemini output', async () => {
    const input = { requestId: 'gemini-check', levelId: bounce.id, sceneVersion: 1, queueRevision: 2,
      messages: [{ id: 'm1', text: 'Pull upward at one metre per second squared.' }], rules: initialRules(bounce) };
    await expect(compileRules(input, gemini(), undefined, reply())).resolves.toMatchObject({ requestId: input.requestId, messages: [{ operations }] });
    const forbidden = { messages: [{ id: 'm1', operations: [{ type: 'set_property', target: bounce.ball.id, property: 'restitution', value: 1 }], error: null }] };
    await expect(compileRules(input, gemini(), undefined, reply(forbidden))).resolves.toMatchObject({ messages: [{ operations: [], error: expect.any(String) }] });
    expect(input.rules).toEqual(initialRules(bounce));
  });

  it('exposes only model and configured state over HTTP, including a missing selected key', async () => {
    for (const key of ['', keys.GEMINI_API_KEY]) {
      const config = loadConfig({ ...keys, AI_PROVIDER: 'gemini', GEMINI_API_KEY: key });
      const fetcher = reply();const server = createApp(config, fetcher).listen(0, '127.0.0.1');servers.push(server);await once(server, 'listening');
      const address = server.address();if (!address || typeof address === 'string') throw new Error('No port.');
      const response = await fetch(`http://127.0.0.1:${address.port}/api/status`);
      expect(await response.json()).toEqual({ model: 'gemini-3.1-flash-lite', configured: !!key });expect(fetcher).not.toHaveBeenCalled();
    }
  });

  it.each(['http://remote.example/openai', 'https://user:pass@gemini.example', 'https://gemini.example?key=private'])('rejects an unsafe Gemini base %s', base => {
    expect(() => loadConfig({ AI_PROVIDER: 'gemini', GEMINI_BASE_URL: base })).toThrow();
  });
  it('rejects misspelled provider and reasoning settings rather than selecting a different saved key', () => {
    expect(() => loadConfig({ ...keys, AI_PROVIDER: 'gimini' })).toThrow();
    expect(() => loadConfig({ ...keys, AI_PROVIDER: 'gemini', GEMINI_REASONING_EFFORT: 'none' })).toThrow();
  });
});
