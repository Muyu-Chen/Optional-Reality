import { describe, expect, it } from 'vitest';
import { scopedRulePreview } from './rule-scope';
import { catchCup } from '../levels/catch-cup';
import type { Operation } from '../../../shared/rules';
const set = (target: string, value: number): Operation => ({ type: 'set_property', target, property: 'restitution', value });
describe('prepared rule targets', () => {
  it('distinguishes a general material change from named surfaces without warnings', () => {
    expect(scopedRulePreview([set('world', 1.5)], catchCup)).toBe('All surfaces · restitution = 1.5');
    expect(scopedRulePreview([set('launch-pad', 1)], catchCup)).toBe('Launch pad · restitution = 1');
    expect(scopedRulePreview([set('cup-base', 0)], catchCup)).toBe('Cup base · restitution = 0');
  });
  it('preserves arithmetic until execution and shows both targets in combined instructions', () => {
    const operations: Operation[] = [{ type: 'add_property', target: 'launch-pad', property: 'restitution', amount: 2 },
      { type: 'scale_property', target: 'world', property: 'friction', factor: 2 }];
    expect(scopedRulePreview(operations, catchCup)).toBe('Launch pad · restitution + 2 · All surfaces · friction × 2');
  });
  it('keeps acceleration direction and magnitude clear', () => {
    expect(scopedRulePreview([{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -1 }], catchCup)).toBe('Acceleration ↑ 1 m/s²');
  });
});
