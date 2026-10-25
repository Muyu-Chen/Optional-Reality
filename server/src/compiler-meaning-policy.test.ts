import { describe, expect, it, vi } from 'vitest';
import { COMPILER_SYSTEM } from './compiler-prompt';
import { MEANING_POLICY } from './compiler-meaning-policy';
import { compileRules } from './compiler';
import { loadConfig } from './config';
import { levels } from '../../client/src/levels/catalog';
import { initialRules } from '../../client/src/levels/rules';
import { prepareMessage } from '../../client/src/domain/queue';

// Mocked contract checks do not measure a provider's language understanding.
// Real semantic cases also live in scripts/check-live-compiler.ts.
describe('meaning-first compiler prompt contract (mocked provider)', () => {
  it.each(['Give the ball an upward buoyancy of 5 newtons.', '向上浮力 5 N', '向上浮力五牛顿'])('flags questionable units first, then exposes a final AI interpretation for review without applying it: %s', async text => {
    const level = levels[0], rules = initialRules(level), before = structuredClone(rules);
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ messages: [{ id: 'm', error: null, operations: [{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -5 }] }] }) } }] }));
    const result = await compileRules({ requestId: 'force-units', levelId: level.id, sceneVersion: 0, queueRevision: 0, rules, messages: [{ id: 'm', text }] }, loadConfig({ AI_API_KEY: 'test-only' }), undefined, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body)).messages[3].content).toContain('newtons');
    expect(result.messages[0]).toMatchObject({ operations: [{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -5 }], understoodAs: expect.stringContaining('AI revised interpretation') });
    expect(rules).toEqual(before);
  });
  it.each(levels)('sends the same semantic policy in $id and preserves a reviewable upward interpretation', async level => {
    const text = '向上的浮力';
    expect(prepareMessage('m', text).requiresAI).toBe(true);
    const rules = initialRules(level), before = structuredClone(rules);
    const operations = [{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -1 }];
    const understoodAs = '将环境竖直加速度设为向上 1 m/s²，保留水平分量。';
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      expect(payload.messages[0]).toEqual({ role: 'system', content: COMPILER_SYSTEM });
      expect(payload.messages[0].content).toContain(MEANING_POLICY);
      expect(JSON.parse(payload.messages[1].content).messages).toEqual([{ id: 'm', text }]);
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ messages: [{ id: 'm', operations, understoodAs, error: null }] }) } }] });
    });
    const result = await compileRules({ requestId: 'meaning', levelId: level.id, sceneVersion: 0, queueRevision: 0, rules, messages: [{ id: 'm', text }] }, loadConfig({ AI_API_KEY: 'test-only' }), undefined, fetcher);
    expect(result.messages).toEqual([{ id: 'm', operations, understoodAs }]);
    expect(rules).toEqual(before);
  });
  it('keeps protected actors protected even when a model calls the operation buoyancy', async () => {
    const level = levels[0];
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ messages: [{ id: 'm', error: null, operations: [{ type: 'set_property', target: level.ball.id, property: 'acceleration_y', value: -1 }] }] }) } }] }));
    const result = await compileRules({ requestId: 'meaning', levelId: level.id, sceneVersion: 0, queueRevision: 0, rules: initialRules(level), messages: [{ id: 'm', text: '让小球向上浮起来' }] }, loadConfig({ AI_API_KEY: 'test-only' }), undefined, fetcher);
    expect(result.messages[0]).toMatchObject({ operations: [], error: expect.any(String) });
  });
});
