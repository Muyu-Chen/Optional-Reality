import { afterEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from './app';
import { compileRules } from './compiler';
import { loadConfig } from './config';
import { requestJson } from './ai-client';
import { initialRules } from '../../client/src/levels/rules';
import { gravityLab } from '../../client/src/levels/gravity-lab';
import { realityBreakdown } from '../../client/src/levels/reality-breakdown';
import type { CompileRequest } from '../../shared/compiler';

const config = loadConfig({ AI_API_KEY: 'test-only-never-a-real-key' });
const request = (): CompileRequest => ({ requestId: 'request-1', levelId: gravityLab.id, sceneVersion: 2, queueRevision: 4,
  messages: [{ id: 'm1', text: 'Halve the gravity and make the surfaces more bouncy.' }], rules: { ...initialRules(gravityLab), gravity: 2 },
});
const answer = (operations: unknown[], id = 'm1', error: string | null = null) => ({ messages: [{ id, operations, error }] });
const provider = (output: unknown, reason = 'stop') => vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ finish_reason: reason, message: { content: JSON.stringify(output) } }] }), { headers: { 'content-type': 'application/json' } }));
const valid = () => answer([{ type: 'scale_property', target: 'world', property: 'gravity', factor: .5 }, { type: 'set_property', target: 'world', property: 'restitution', value: .7 }]);
const servers: Server[] = [];
afterEach(async () => { for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } });
async function endpoint(key = config.apiKey, fetcher = provider(valid())) {
  const server = createApp({ ...config, apiKey: key }, fetcher).listen(0, '127.0.0.1'); servers.push(server); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No address.');
  return { base: `http://127.0.0.1:${address.port}`, fetcher };
}

describe('AI compiler with a mocked provider (no live credentials)', () => {
  it('sends the requested model and JSON format, and preserves relative multi-operation commands', async () => {
    const fetcher = provider(valid()), input = request();
    const result = await compileRules(input, config, undefined, fetcher);
    expect(result).toMatchObject({ requestId: input.requestId, sceneVersion: 2, queueRevision: 4 });
    expect(result.messages[0].operations).toEqual(valid().messages[0].operations);
    expect(input.rules.gravity).toBe(2);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    const sent = JSON.parse(String(init?.body));
    expect(sent).toMatchObject({ model: 'deepseek-flash', response_format: { type: 'json_object' }, thinking: { type: 'disabled' }, stream: false });
    expect(sent.messages[1].content).toContain('Halve the gravity');
    expect(JSON.stringify(result)).not.toContain(config.apiKey);
  });
  it('accepts the factory sensor condition from scene-specific IDs', async () => {
    const input = { ...request(), levelId: realityBreakdown.id, rules: initialRules(realityBreakdown) };
    const result = await compileRules(input, config, undefined, provider(answer([{ type: 'add_sensor_trigger', sensor: 'sensor-gate', gate: 'gate-final' }])));
    expect(result.messages[0].operations[0].type).toBe('add_sensor_trigger');
  });
  it.each([
    answer([{ type: 'set_property', target: 'ball-A', property: 'friction', value: 0 }]),
    answer([{ type: 'set_gravity', acceleration: Infinity }]),
    answer([{ type: 'set_property', target: 'world', property: 'restitution', value: 999 }]),
    answer([{ type: 'add_sensor_trigger', sensor: 'imaginary', gate: 'gate-final' }]),
    answer([{ type: 'eval', code: 'arbitrary code' }]),
    answer([{ type: 'set_gravity', acceleration: 1 }], 'wrong-id'),
    answer([]),
    answer([], 'm1', 'Automatic conditions are not supported.'),
  ])('rejects invalid schema, targets, ranges, IDs, or unsupported commands: %#', async output => {
    const input = request(), previous = structuredClone(input);
    await expect(compileRules(input, config, undefined, provider(output))).rejects.toThrow();
    expect(input).toEqual(previous);
  });
  it('rejects truncated, non-JSON, and refused model responses', async () => {
    await expect(compileRules(request(), config, undefined, provider(valid(), 'length'))).rejects.toThrow('complete');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: '```json\n{}\n```' } }] })));
    await expect(compileRules(request(), config, undefined, fetcher)).rejects.toThrow('invalid rule JSON');
  });
  it('handles missing keys and provider errors without exposing provider bodies or credentials', async () => {
    await expect(compileRules(request(), { ...config, apiKey: '' }, undefined, provider(valid()))).rejects.toMatchObject({ status: 503 });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('secret provider diagnostics', { status: 401 }));
    await expect(compileRules(request(), config, undefined, fetcher)).rejects.toThrow('rejected the server API key');
  });
  it('aborts a slow provider at the timeout and supports cancellation', async () => {
    const slow = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
    }));
    await expect(requestJson({ ...config, timeoutMs: 30 }, 'JSON', '{}', undefined, slow)).rejects.toMatchObject({ status: 504 });
    const controller = new AbortController();
    const pending = requestJson(config, 'JSON', '{}', controller.signal, slow); controller.abort();
    await expect(pending).rejects.toMatchObject({ status: 499 });
  });
  it('returns identity tokens and operations through the actual HTTP endpoint', async () => {
    const { base } = await endpoint();
    const response = await fetch(`${base}/api/compile`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request()) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ requestId: 'request-1', sceneVersion: 2, queueRevision: 4, messages: [{ id: 'm1' }] });
  });
  it('reports missing-key status and rejects invalid requests before contacting the provider', async () => {
    const { base, fetcher } = await endpoint('');
    const status = await (await fetch(`${base}/api/status`)).json();
    expect(status).toEqual({ configured: false, model: 'deepseek-flash' });
    for (const body of [{ ...request(), levelId: 'unknown' }, { ...request(), messages: [] }, { ...request(), messages: [request().messages[0], request().messages[0]] }]) {
      const response = await fetch(`${base}/api/compile`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      expect(response.ok).toBe(false);
    }
    expect(fetcher).not.toHaveBeenCalled();
    const response = await fetch(`${base}/api/compile`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request()) });
    expect(response.status).toBe(503);
  });
  it('rejects cross-origin requests and never serves the local .env', async () => {
    const { base, fetcher } = await endpoint();
    const response = await fetch(`${base}/api/compile`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://unrelated.example' }, body: JSON.stringify(request()) });
    expect(response.status).toBe(403); expect(fetcher).not.toHaveBeenCalled();
    expect((await fetch(`${base}/.env`)).status).toBe(404);
  });
});
