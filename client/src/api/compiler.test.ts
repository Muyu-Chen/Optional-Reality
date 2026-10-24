import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareWithAI } from './compiler';
import { initialRules } from '../levels/rules';
import { gravityLab } from '../levels/gravity-lab';

const input = { requestId: 'r1', levelId: 'gravity-lab', sceneVersion: 1, queueRevision: 3,
  messages: [{ id: 'm1', text: 'Turn off gravity' }], rules: initialRules(gravityLab) };
const output = { requestId: 'r1', levelId: 'gravity-lab', sceneVersion: 1, queueRevision: 3,
  messages: [{ id: 'm1', operations: [{ type: 'set_gravity', acceleration: 0 }] }] };
afterEach(() => vi.unstubAllGlobals());
describe('client compiler identity checks', () => {
  it('accepts the current queue response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(output))));
    expect((await prepareWithAI(input, new AbortController().signal)).messages[0].id).toBe('m1');
  });
  it.each([{ queueRevision: 2 }, { sceneVersion: 0 }, { requestId: 'old' }, { levelId: 'other' }, { messages: [{ id: 'wrong', operations: output.messages[0].operations }] }])('rejects stale or mismatched output %#', async overrides => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...output, ...overrides }))));
    await expect(prepareWithAI(input, new AbortController().signal)).rejects.toThrow();
  });
  it('passes the cancellation signal and preserves the server error for missing keys', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Add AI_API_KEY' }), { status: 503 }));
    vi.stubGlobal('fetch', fetcher);
    const controller = new AbortController();
    await expect(prepareWithAI(input, controller.signal)).rejects.toThrow('Add AI_API_KEY');
    expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
