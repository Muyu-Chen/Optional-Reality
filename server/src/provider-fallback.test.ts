import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import { loadConfig } from './config';
import { compileRules } from './compiler';
import { createApp } from './app';
import { gravityLab } from '../../client/src/levels/gravity-lab';
import { initialRules } from '../../client/src/levels/rules';

const env = { AI_PROVIDER: 'gemini', AI_FALLBACK_PROVIDER: 'deepseek', AI_API_KEY: 'private-deepseek-key', GEMINI_API_KEY: 'private-gemini-key' };
const config = () => loadConfig(env);
const input = () => ({ requestId: 'fallback-test', levelId: gravityLab.id, sceneVersion: 1, queueRevision: 2,
  rules: initialRules(gravityLab), messages: [{ id: 'm1', text: 'PRIVATE_PLAYER_MESSAGE' }] });
const output = (value = 1) => ({ messages: [{ id: 'm1', operations: [{ type: 'set_property', target: 'world', property: 'acceleration_y', value }], error: null }] });
const reply = (body: unknown = output()) => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(body) } }] });

beforeEach(() => { vi.spyOn(console, 'info').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

describe('explicit Gemini to DeepSeek fallback configuration', () => {
  it('keeps fallback opt-in and credentials scoped to their own endpoint', () => {
    expect(loadConfig({ ...env, AI_FALLBACK_PROVIDER: 'none' }).fallback).toBeUndefined();
    expect(loadConfig({ ...env, AI_PROVIDER: 'compatible' }).fallback).toBeUndefined();
    expect(config()).toMatchObject({ apiKey: env.GEMINI_API_KEY, primaryTimeoutMs: 8000,
      fallback: { apiKey: env.AI_API_KEY, baseUrl: 'https://api.deepseek.com', provider: 'compatible' } });
    expect(config().fallback).not.toHaveProperty('fallback');
  });
  it.each(['https://another-provider.example', 'http://localhost:3000', 'https://api.deepseek.com.evil.example'])('never sends the backup key to %s', base => {
    expect(() => loadConfig({ ...env, AI_BASE_URL: base })).toThrow('DeepSeek fallback requires');
  });
  it.each(['99', '120001', 'NaN'])('validates the primary timeout %s', timeout => {
    expect(() => loadConfig({ ...env, AI_PRIMARY_TIMEOUT_MS: timeout })).toThrow();
  });
  it('rejects an unknown fallback setting', () => {
    expect(() => loadConfig({ ...env, AI_FALLBACK_PROVIDER: 'deepseak' })).toThrow();
  });
});

describe('provider attempts, output checks and cancellation', () => {
  it('does not call DeepSeek after a successful Gemini response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => reply());
    await compileRules(input(), config(), undefined, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain('googleapis.com');
  });
  it.each([400, 401, 403, 429, 500, 502, 503])('falls back once after Gemini HTTP %s with separate credentials and unchanged input', async status => {
    const request = input(), before = structuredClone(request);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('PRIVATE_PROVIDER_BODY', { status }))
      .mockImplementation(async () => reply());
    const result = await compileRules(request, config(), undefined, fetcher);
    expect(result).toMatchObject({ requestId: request.requestId, messages: [{ operations: [{ value: 1 }] }] });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const [google, backup] = fetcher.mock.calls;
    expect(google[1]!.headers).toMatchObject({ authorization: `Bearer ${env.GEMINI_API_KEY}` });
    expect(backup[0]).toBe('https://api.deepseek.com/chat/completions');
    expect(backup[1]!.headers).toMatchObject({ authorization: `Bearer ${env.AI_API_KEY}` });
    const first = JSON.parse(String(google[1]!.body)), second = JSON.parse(String(backup[1]!.body));
    expect(second.messages).toEqual(first.messages);
    expect(second).toMatchObject({ model: 'deepseek-flash', thinking: { type: 'disabled' } });
    expect(second.reasoning_effort).toBeUndefined();
    expect(request).toEqual(before);
    const logs = JSON.stringify([vi.mocked(console.info).mock.calls, vi.mocked(console.warn).mock.calls]);
    for (const secret of ['PRIVATE_PROVIDER_BODY', 'PRIVATE_PLAYER_MESSAGE', ...Object.values(env).filter(value => value.includes('private-'))]) expect(logs).not.toContain(secret);
    expect(logs).toContain(`\\"upstreamStatus\\":${status}`);
  });
  it.each([
    () => { throw new Error('PRIVATE_NETWORK_DIAGNOSTIC'); },
    () => new Response('{broken'),
    () => Response.json({ choices: [] }),
    () => Response.json({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] }),
    () => reply({ messages: [{ id: 'wrong', operations: [], error: null }] }),
    () => reply({ wrong: 'shape' }),
  ])('falls back for network, envelope or identity failure %#', async first => {
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce(async () => first()).mockImplementation(async () => reply());
    expect((await compileRules(input(), config(), undefined, fetcher)).messages[0].operations).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('uses DeepSeek when Gemini is unconfigured, without sending DeepSeek credentials to Google', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => reply());
    await compileRules(input(), loadConfig({ ...env, GEMINI_API_KEY: '' }), undefined, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain('api.deepseek.com');
  });
  it('preserves the original error if the backup is not configured', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 429 }));
    await expect(compileRules(input(), loadConfig({ ...env, AI_API_KEY: '' }), undefined, fetcher)).rejects.toThrow('rate limit');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    { messages: [{ id: 'm1', operations: [], error: 'Teleporting is unsupported.' }] },
    { messages: [{ id: 'm1', operations: [{ type: 'set_property', target: 'ball-A', property: 'restitution', value: 1 }], error: null }] },
  ])('does not override an explicit rejection or permission failure with another model', async body => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => reply(body));
    expect((await compileRules(input(), config(), undefined, fetcher)).messages[0]).toMatchObject({ operations: [], error: expect.any(String) });
    expect(fetcher).toHaveBeenCalledTimes(body.messages[0].error === null ? 2 : 1);
    expect(fetcher.mock.calls.every(([url]) => String(url).includes('generativelanguage.googleapis.com'))).toBe(true);
  });
  it('validates player input before contacting either model', async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(compileRules({ ...input(), levelId: 'unknown' }, config(), undefined, fetcher)).rejects.toThrow('Unknown level');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['before', 'primary', 'backup'])('never retries after player cancellation during %s', async phase => {
    const controller = new AbortController();
    if (phase === 'before') controller.abort();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => {
      if (phase === 'backup' && fetcher.mock.calls.length === 1) return new Response('', { status: 500 });
      controller.abort(); return new Promise<Response>(() => {});
    });
    await expect(compileRules(input(), config(), controller.signal, fetcher)).rejects.toMatchObject({ status: 499 });
    expect(fetcher).toHaveBeenCalledTimes(phase === 'before' ? 0 : phase === 'primary' ? 1 : 2);
  });
  it('falls back on a stalled Gemini body even if its response ignores abort', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(new ReadableStream({ start() {} })))
      .mockImplementation(async () => reply());
    await expect(compileRules(input(), loadConfig({ ...env, AI_PRIMARY_TIMEOUT_MS: '100', AI_TIMEOUT_MS: '1000' }), undefined, fetcher)).resolves.toMatchObject({ messages: [{ operations: [{ value: 1 }] }] });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1]!.signal!.aborted).toBe(true);
  });
  it('shares one total deadline across two attempts even if both ignore abort', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise<Response>(() => {}));
    await expect(compileRules(input(), loadConfig({ ...env, AI_PRIMARY_TIMEOUT_MS: '100', AI_TIMEOUT_MS: '180' }), undefined, fetcher)).rejects.toMatchObject({ status: 504 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1]!.signal!.aborted).toBe(true);
  });
  it('returns a clean error after two failures and does not loop', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response('PRIVATE', { status: 500 }));
    await expect(compileRules(input(), config(), undefined, fetcher)).rejects.toMatchObject({ status: 502, message: 'Gemini and DeepSeek could not prepare the rules. Try again shortly.' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('HTTP compatibility for old open tabs', () => {
  it.each([undefined, 'old-format', 'per-message-v1'])('negotiates failed rows for protocol %s', async protocol => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => reply({ messages: [{ id: 'm1', operations: [], error: 'Unsupported instruction.' }] }));
    const server = createApp(config(), fetcher).listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
      const response = await fetch(`http://127.0.0.1:${address.port}/api/compile`, { method: 'POST', headers: { 'content-type': 'application/json', ...(protocol ? { 'x-compiler-protocol': protocol } : {}) }, body: JSON.stringify(input()) });
      expect(response.status).toBe(protocol === 'per-message-v1' ? 200 : 422);
      const body = await response.json();
      if (protocol === 'per-message-v1') expect(body.messages[0]).toEqual({ id: 'm1', operations: [], error: 'Unsupported instruction.' });
      else { expect(body).toEqual({ error: 'Message 1: Unsupported instruction.' }); expect(body.messages).toBeUndefined(); }
    } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});
