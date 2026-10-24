import { afterEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from './app';
import { loadConfig } from './config';
import { initialRules } from '../../client/src/levels/rules';
import { gravityLab } from '../../client/src/levels/gravity-lab';

const config = loadConfig({ AI_API_KEY: 'test-key-only' });
const input = {
  requestId: 'http-test', levelId: gravityLab.id, sceneVersion: 0, queueRevision: 0,
  messages: [{ id: 'message', text: 'add gravity' }], rules: initialRules(gravityLab),
};
const answer = () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
  messages: [{ id: 'message', operations: [{ type: 'set_gravity', acceleration: 1 }], error: null }],
}) } }] });
const servers: Server[] = [];
afterEach(async () => {
  vi.restoreAllMocks(); vi.unstubAllEnvs();
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
async function endpoint(provider = vi.fn<typeof fetch>().mockImplementation(async () => answer())) {
  const server = createApp(config, provider).listen(0, '127.0.0.1');
  servers.push(server); await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test address');
  const base = `http://127.0.0.1:${address.port}`;
  const post = (signal?: AbortSignal) => fetch(`${base}/api/compile`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input), signal,
  });
  return { base, post, provider };
}

describe('HTTP request boundaries (mocked model provider)', () => {
  it.each([
    ['wrong content type', 'text/plain', '{}', 415],
    ['malformed JSON', 'application/json', '{broken', 400],
    ['oversized JSON', 'application/json', JSON.stringify({ text: 'x'.repeat(40000) }), 413],
    ['invalid request schema', 'application/json', '{}', 422],
  ])('rejects %s before contacting the model', async (_name, contentType, body, status) => {
    const { base, provider } = await endpoint();
    const response = await fetch(`${base}/api/compile`, {
      method: 'POST', headers: { 'content-type': String(contentType) }, body: String(body),
    });
    expect(response.status).toBe(status);
    expect(typeof (await response.json()).error).toBe('string');
    expect(provider).not.toHaveBeenCalled();
  });

  it('limits concurrent preparations and releases slots after provider success and failure', async () => {
    const release: ((response: Response) => void)[] = [];
    const provider = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      if (release.length >= 4) return answer();
      return new Promise<Response>((resolve, reject) => {
        release.push(resolve);
        init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
      });
    });
    const { post } = await endpoint(provider);
    const pending = Array.from({ length: 4 }, () => post());
    await vi.waitFor(() => expect(provider).toHaveBeenCalledTimes(4), { interval: 2 });
    expect((await post()).status).toBe(429);
    release.forEach((resolve, index) => resolve(index === 0 ? new Response('private diagnostics', { status: 500 }) : answer()));
    const responses = await Promise.all(pending);
    expect(responses.map(response => response.status).sort()).toEqual([200, 200, 200, 502]);
    expect(responses[1].headers.get('cache-control')).toBe('no-store');
    expect((await post()).status).toBe(200);
    expect(provider).toHaveBeenCalledTimes(5);
  });

  it('cancels a disconnected client’s provider request and makes its concurrency slot reusable', async () => {
    const signals: AbortSignal[] = [], release: ((response: Response) => void)[] = [];
    const provider = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      if (signals.length >= 4) return answer();
      signals.push(init!.signal!);
      return new Promise<Response>((resolve, reject) => {
        release.push(resolve);
        init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
      });
    });
    const { post } = await endpoint(provider);
    const controller = new AbortController();
    const abandoned = post(controller.signal).catch(error => error);
    const remaining = Array.from({ length: 3 }, () => post());
    await vi.waitFor(() => expect(signals).toHaveLength(4), { interval: 2 });
    expect((await post()).status).toBe(429);
    controller.abort(); await abandoned;
    await vi.waitFor(() => expect(signals.some(signal => signal.aborted)).toBe(true), { interval: 2 });
    expect((await post()).status).toBe(200);
    release.forEach(resolve => resolve(answer()));
    expect((await Promise.all(remaining)).every(response => response.status === 200)).toBe(true);
  });

  it('resets the 30-request budget exactly at the one-minute boundary', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const { post, provider } = await endpoint();
    for (let i = 0; i < 30; i++) expect((await post()).status).toBe(200);
    expect((await post()).status).toBe(429);
    expect(provider).toHaveBeenCalledTimes(30);
    now.mockReturnValue(1_060_000);
    expect((await post()).status).toBe(200);
    expect(provider).toHaveBeenCalledTimes(31);
  });

  it('allows the configured application origin and rejects another origin without calling the model', async () => {
    vi.stubEnv('APP_ORIGIN', 'https://game.example');
    const { base, provider } = await endpoint();
    const call = (origin: string) => fetch(`${base}/api/compile`, {
      method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(input),
    });
    expect((await call('https://game.example')).status).toBe(200);
    expect((await call('https://different.example')).status).toBe(403);
    expect(provider).toHaveBeenCalledTimes(1);
  });
});
