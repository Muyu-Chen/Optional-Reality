import { describe, expect, it } from 'vitest';
import { reviewForClient } from './compiler-review-compatibility';
import { validateCompilation } from '../../shared/compiler';
import { initialRules, ruleContext } from '../../client/src/levels/rules';
import { bounce } from '../../client/src/levels/bounce';

const request = { requestId: 'r', levelId: bounce.id, sceneVersion: 0, queueRevision: 0, rules: initialRules(bounce), messages: [{ id: 'm', text: 'Set bounce to .4' }] };
const result = () => validateCompilation(request, { messages: [{ id: 'm', operations: [{ type: 'set_property', target: 'world', property: 'restitution', value: .4 }], error: null }] }, ruleContext(bounce));
describe('AI review capability for cached pages', () => {
  it('leaves ordinary first-round results unchanged', () => {
    const initial = result();expect(reviewForClient(initial, false)).toEqual(initial);
  });
  it('returns a readable refresh error for a page that might auto-apply a revision', () => {
    const initial = result();initial.messages[0] = { ...initial.messages[0], understoodAs: 'AI revised interpretation: restitution = 0.4' };
    expect(reviewForClient(initial, false).messages[0]).toMatchObject({ operations: [], error: expect.stringContaining('Refresh') });
    expect(reviewForClient(initial, true)).toBe(initial);
  });
});
