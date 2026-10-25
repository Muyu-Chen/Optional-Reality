import { describe, expect, it, vi } from 'vitest';
import { levels } from '../../client/src/levels/catalog';
import { initialRules, ruleContext } from '../../client/src/levels/rules';
import type { CompileRequest } from '../../shared/compiler';
import { applyRules } from '../../shared/rules';
import { compileRules } from './compiler';
import { COMPILER_SYSTEM } from './compiler-prompt';
import { loadConfig } from './config';

const config = loadConfig({ AI_API_KEY: 'test-only-never-a-real-key' });
const operations = [
  { type: 'set_property', target: 'world', property: 'acceleration_x', value: 2 },
  {type:'set_property',target:'world',property:'acceleration_y',value:1 },
  { type: 'set_property', target: 'world', property: 'restitution', value: .8 },
  { type: 'set_property', target: 'world', property: 'friction', value: .3 },
];
function provider() {
  return vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
    const user = JSON.parse(JSON.parse(String(init?.body)).messages[1].content);
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
      messages: user.messages.map((message: { id: string }) => ({ id: message.id, operations, error: null })),
    }) } }] }));
  });
}
function request(level: typeof levels[number]): CompileRequest {
  return { requestId: 'prefix-test', levelId: level.id, sceneVersion: 0, queueRevision: 0,
    rules: initialRules(level), messages: [{ id: 'm1', text: 'Add acceleration to the right, gravity and surface bounce and friction.' }] };
}
function sent(fetcher: ReturnType<typeof provider>, index = 0): { messages: { role: string; content: string }[] } {
  return JSON.parse(String(fetcher.mock.calls[index][1]?.body));
}

describe('shared compiler vocabulary and stable prefixes (mocked API)', () => {
  it.each(levels)('compiles all base controls in $id with an identical system prefix', async level => {
    const input = request(level), fetcher = provider();
    const result = await compileRules(input, config, undefined, fetcher);
    expect(sent(fetcher).messages[0]).toEqual({ role: 'system', content: COMPILER_SYSTEM });
    expect(result.messages[0].operations).toEqual(operations);
    const next = applyRules(input.rules, result.messages[0].operations, ruleContext(level));
    expect(next.acceleration.y).toBe(1);
    expect(next.values.world).toMatchObject({ restitution: .8, friction: .3 });
    expect(input.rules).toEqual(initialRules(level));
  });
  it('keeps all static scene bytes before changed state and player instructions', async () => {
    const level = levels[0], input = request(level), fetcher = provider();
    await compileRules(input, config, undefined, fetcher);
    const changed = { ...input, sceneVersion: 9, queueRevision: 10, requestId: 'different',
      rules: { ...input.rules, acceleration:{x:0,y:3} }, messages: [{ id: 'm2', text: 'Reverse horizontal acceleration.' }] };
    await compileRules(changed, config, undefined, fetcher);
    const first = sent(fetcher), second = sent(fetcher, 1);
    expect(second.messages[0]).toEqual(first.messages[0]);
    const scenePrefix = (content: string) => content.slice(0, content.indexOf(',"currentRules":'));
    expect(scenePrefix(first.messages[1].content)).not.toBe('');
    expect(scenePrefix(second.messages[1].content)).toBe(scenePrefix(first.messages[1].content));
    expect(JSON.parse(second.messages[1].content)).toMatchObject({ currentRules: { acceleration:{x:0,y:3} }, messages: changed.messages });
    expect(first.messages[1].content).not.toBe(second.messages[1].content);
    // A different scene changes scene data, while retaining the universal system vocabulary.
    await compileRules(request(levels.at(-1)!), config, undefined, fetcher);
    expect(sent(fetcher, 2).messages[0]).toEqual(first.messages[0]);
    expect(scenePrefix(sent(fetcher, 2).messages[1].content)).not.toBe(scenePrefix(first.messages[1].content));
  });
});
