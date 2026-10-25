import { afterEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from './app';
import { loadConfig } from './config';
import { initialRules } from '../../client/src/levels/rules';
import { bounce } from '../../client/src/levels/bounce';
import { ARITHMETIC_HEADER, ARITHMETIC_VERSION } from '../../shared/arithmetic-protocol';
import { COMPILER_SYSTEM } from './compiler-prompt';

const servers: Server[] = [];
afterEach(async () => { for (const server of servers.splice(0)) { server.closeAllConnections();await new Promise<void>(resolve => server.close(() => resolve())); } });

describe('arithmetic HTTP compilation and compatibility', () => {
  it.each([true, false])('returns +2 as addition only to a capable client: %s', async capable => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ messages: [
      { id: 'add', operations: [{ type: 'add_property', target: 'world', property: 'restitution', amount: 2 }], error: null },
      { id: 'stop', operations: [{ type: 'set_gravity', acceleration: 0 }], error: null },
    ] }) } }] }));
    const server = createApp(loadConfig({ AI_API_KEY: 'test-only' }), fetcher).listen(0, '127.0.0.1');servers.push(server);await once(server, 'listening');
    const address = server.address();if (!address || typeof address === 'string') throw new Error('No address');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/compile`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-compiler-protocol': 'per-message-v1', ...(capable ? { [ARITHMETIC_HEADER]: ARITHMETIC_VERSION } : {}) },
      body: JSON.stringify({ requestId: 'r', levelId: bounce.id, sceneVersion: 0, queueRevision: 0, rules: initialRules(bounce), messages: [{ id: 'add', text: 'padding 弹力+2' }, { id: 'stop', text: 'stop gravity' }] }),
    });
    expect(response.status).toBe(200);const result = await response.json();
    if (capable) expect(result.messages[0].operations[0]).toEqual({ type: 'add_property', target: 'world', property: 'restitution', amount: 2 });
    else expect(result.messages[0]).toMatchObject({ operations: [], error: expect.stringMatching(/Refresh/) });
    expect(result.messages[1].operations[0]).toMatchObject({ type: 'set_property', property: 'acceleration_y', value: 0 });
  });
  it('teaches the model to keep addition, multiplication and assignment distinct', () => {
    expect(COMPILER_SYSTEM).toContain('add_property');
    expect(COMPILER_SYSTEM).toContain('never doubling');
    expect(COMPILER_SYSTEM).toContain('gravity = +2');
  });
});
