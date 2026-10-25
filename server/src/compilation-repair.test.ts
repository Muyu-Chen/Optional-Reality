import { describe, expect, it, vi } from 'vitest';
import { compileRules } from './compiler';
import { loadConfig } from './config';
import { initialRules, ruleContext } from '../../client/src/levels/rules';
import { bounce } from '../../client/src/levels/bounce';
import { validateCompilation, type CompileRequest } from '../../shared/compiler';
import { repairCompilation } from './compilation-repair';

const config = loadConfig({ AI_API_KEY: 'test-only' });
const context = ruleContext(bounce);
const additive = { type: 'add_property', target: 'world', property: 'restitution', amount: 2 };
const wrong = { type: 'scale_property', target: 'world', property: 'restitution', factor: 2 };
const set = { type: 'set_property', target: 'world', property: 'restitution', value: .4 };
const input = (): CompileRequest => ({ requestId: 'repair-test', levelId: bounce.id, sceneVersion: 0, queueRevision: 0,
  messages: [{ id: 'good', text: 'Set bounce to 0.4' }, { id: 'bad', text: 'surface bounce +2' }, { id: 'no', text: 'Paint the ball red' }], rules: initialRules(bounce) });
const output = () => ({ messages: [
  { id: 'good', operations: [set], error: null }, { id: 'bad', operations: [wrong], error: null },
  { id: 'no', operations: [], error: 'The ball cannot be painted.' },
] });
const repaired = () => ({ messages: [{ id: 'bad', operations: [additive], error: null }] });
const envelope = (data: unknown) => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(data) } }] });

describe('one AI correction turn after rule validation', () => {
  it('sends the previous answer and concrete feedback, repairs only the rejected row and preserves Ready', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope(output())).mockResolvedValueOnce(envelope(repaired()));
    const result = await compileRules(input(), config, undefined, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.messages[0]).toEqual(validateCompilation(input(), output(), context).messages[0]);
    expect(result.messages[1].operations).toEqual([additive]);expect(result.messages[2]).toHaveProperty('error');
    const sent = JSON.parse(String(fetcher.mock.calls[1][1]?.body));
    expect(sent.messages.map((message: { role: string }) => message.role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(JSON.parse(sent.messages[2].content)).toEqual(output());
    const feedback = sent.messages[3].content;
    expect(feedback).toContain('surface bounce +2');expect(feedback).toContain('addition or subtraction');
    expect(feedback).not.toContain('Paint the ball red');expect(feedback).not.toContain('Set bounce to 0.4');
    expect(input().rules.values.world.restitution).toBe(.1);
  });
  it('lets the executable final AI interpretation through without repeating meaning heuristics', async () => {
    const again = { messages: [{ id: 'bad', operations: [wrong], error: null }] };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope(output())).mockResolvedValueOnce(envelope(again));
    const result = await compileRules(input(), config, undefined, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.messages[1]).toMatchObject({ operations: [wrong], understoodAs: expect.stringContaining('AI revised interpretation: restitution × 2') });
    expect(result.messages[0].operations).toEqual([set]);
  });
  it('includes concrete schema paths when the first operation has the wrong field types', async () => {
    const raw = output();raw.messages[1] = { id: 'bad', operations: [{ ...wrong, factor: '2' } as unknown as typeof wrong], error: null };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope(raw)).mockResolvedValueOnce(envelope(repaired()));
    expect((await compileRules(input(), config, undefined, fetcher)).messages[1].operations).toEqual([additive]);
    const feedback = JSON.parse(String(fetcher.mock.calls[1][1]?.body)).messages[3].content;
    expect(feedback).toContain('invalid_type');expect(feedback).toContain('factor');
  });
  it.each([
    { messages: [] }, { messages: [{ id: 'wrong', operations: [additive], error: null }] },
    { messages: [{ id: 'bad', operations: [additive], error: null }, { id: 'good', operations: [set], error: null }] },
  ])('keeps all original outcomes when repair IDs cannot be trusted: %#', async response => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope(output())).mockResolvedValueOnce(envelope(response));
    expect(await compileRules(input(), config, undefined, fetcher)).toEqual(validateCompilation(input(), output(), context));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('does not run correction for success or an explicit unsupported-intent error', async () => {
    const data = output();data.messages[1] = { id: 'bad', operations: [], error: 'Unsupported intent.' };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(envelope(data));
    await compileRules(input(), config, undefined, fetcher);expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('keeps valid results if the corrective network request fails', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope(output())).mockRejectedValueOnce(new Error('offline'));
    expect(await compileRules(input(), config, undefined, fetcher)).toEqual(validateCompilation(input(), output(), context));
  });
  it('cancels a pending correction and never starts another turn', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope(output())).mockImplementationOnce(() => new Promise(() => {}));
    const pending = compileRules(input(), config, controller.signal, fetcher);
    const rejected = expect(pending).rejects.toMatchObject({ status: 499 });
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));controller.abort();await rejected;
    expect(fetcher.mock.calls[1][1]?.signal?.aborted).toBe(true);expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('shares a single time budget with the original request, even if the repair ignores abort', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(envelope(output())), 100)))
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(envelope(repaired())), 150)));
    const result = await compileRules(input(), { ...config, timeoutMs: 200 }, undefined, fetcher);
    expect(result.messages[1]).toHaveProperty('error');expect(result.messages[0].operations).toEqual([set]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('does not permit a repaired operation to edit a protected object', async () => {
    const bad = { messages: [{ id: 'bad', operations: [{ ...additive, target: 'ball-A' }], error: null }] };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(envelope(output())).mockResolvedValueOnce(envelope(bad));
    const result = await compileRules(input(), config, undefined, fetcher);
    expect(result.messages[1]).toMatchObject({ operations: [], error: expect.stringContaining('cannot run in this scene') });
  });
  it('uses the provider that actually answered after failover, without restarting Gemini', async () => {
    const settings = loadConfig({ AI_PROVIDER: 'gemini', AI_FALLBACK_PROVIDER: 'deepseek', GEMINI_API_KEY: 'test-gemini', AI_API_KEY: 'test-deepseek' });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(envelope(output())).mockResolvedValueOnce(envelope(repaired()));
    expect((await compileRules(input(), settings, undefined, fetcher)).messages[1].operations).toEqual([additive]);
    expect(fetcher.mock.calls.map(([url]) => new URL(String(url)).hostname)).toEqual(['generativelanguage.googleapis.com', 'api.deepseek.com', 'api.deepseek.com']);
  });
  it('rejects repair conflicts without downgrading an already Ready trigger', async () => {
    const sensors = Array.from({ length: 25 }, (_, index) => `s${index}`);
    const expanded = { ...context, sensors, gates: ['g'] };
    const trigger = (sensor: string) => ({ type: 'add_sensor_trigger', sensor, gate: 'g' });
    const request = { ...input(), messages: [{ id: 'bad', text: 'Register one trigger' }, { id: 'good', text: 'Register another trigger' }],
      rules: { ...initialRules(bounce), triggers: sensors.slice(0, 23).map(sensor => ({ sensor, gate: 'g' })) } };
    const raw = { messages: [{ id: 'bad', operations: [{ type: 'eval' }], error: null }, { id: 'good', operations: [trigger('s24')], error: null }] };
    const first = validateCompilation(request, raw, expanded);
    const result = await repairCompilation(request, raw, first, expanded, async () => ({ messages: [{ id: 'bad', operations: [trigger('s23')], error: null }] }), AbortSignal.timeout(1000));
    expect(result.messages[0]).toMatchObject({ operations: [], error: expect.stringContaining('conflicted') });
    expect(result.messages[1]).toEqual(first.messages[1]);expect(request.rules.triggers).toHaveLength(23);
  });
});
