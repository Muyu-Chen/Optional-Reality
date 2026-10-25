import { afterEach, expect, it, vi } from 'vitest';
import { prepareWithAI } from './compiler';
import { initialRules } from '../levels/rules';
import { bounce } from '../levels/bounce';

afterEach(() => vi.unstubAllGlobals());
it('announces arithmetic support and accepts an unresolved additive operation', async () => {
  const request = { requestId: 'r', levelId: bounce.id, sceneVersion: 0, queueRevision: 0, messages: [{ id: 'm', text: 'padding 弹力+2' }], rules: initialRules(bounce) };
  const operation = { type: 'add_property', target: 'world', property: 'restitution', amount: 2 };
  const { rules: _rules, ...identity } = request;
  const fetcher = vi.fn().mockResolvedValue(Response.json({ ...identity, messages: [{ id: 'm', operations: [operation] }] }));vi.stubGlobal('fetch', fetcher);
  expect((await prepareWithAI(request, new AbortController().signal)).messages[0].operations).toEqual([operation]);
  expect(fetcher.mock.calls[0][1].headers).toMatchObject({ 'x-rule-arithmetic': 'add-v1' });
});
