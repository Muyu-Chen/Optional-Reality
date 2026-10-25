import { describe, expect, it } from 'vitest';
import { applyRules, type Operation } from './rules';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { catchCup } from '../client/src/levels/catch-cup';

const set = (target: string, value: number): Operation => ({ type: 'set_property', target, property: 'restitution', value });
const context = ruleContext(catchCup);
describe('general material edits follow player scope', () => {
  it('changes both editable surfaces, with clamping, without touching the actor or preset walls', () => {
    const before = initialRules(catchCup), saved = structuredClone(before);
    const after = applyRules(before, [set('world', 10)], context);
    expect(after.values.world.restitution).toBe(1.5);
    expect(after.values['launch-pad'].restitution).toBe(1.5);
    expect(after.values['cup-base'].restitution).toBe(1.5);
    expect(after.values['cup-base'].friction).toBe(.5);
    expect(after.values['cup-left']).toEqual(saved.values['cup-left']);
    expect(after.acceleration).toEqual(before.acceleration);
    expect(after.values['ball-A']).toBeUndefined();
    expect(before).toEqual(saved);
  });
  it('keeps explicit edits local, and a later general command reaches them again', () => {
    const local = applyRules(initialRules(catchCup), [set('launch-pad', 1)], context);
    expect(local.values['cup-base'].restitution).toBe(1.05);
    expect(local.values.world.restitution).toBe(0);
    expect(applyRules(local, [set('world', .8)], context).values['launch-pad'].restitution).toBe(.8);
    expect(applyRules(local, [set('world', .8), set('cup-base', 0)], context).values['cup-base'].restitution).toBe(0);
    expect(applyRules(local, [set('cup-base', 0), set('world', .8)], context).values['cup-base'].restitution).toBe(.8);
  });
  it.each([
    [{ type: 'scale_property', target: 'world', property: 'restitution', factor: 2 }, .2, 1.5],
    [{ type: 'add_property', target: 'world', property: 'restitution', amount: .2 }, .3, 1.25],
    [{ type: 'add_property', target: 'world', property: 'restitution', amount: -2 }, 0, 0],
  ] as const)('resolves %j against each surface at execution time', (operation, pad, cup) => {
    const after = applyRules(initialRules(catchCup), [operation], context);
    expect(after.values['launch-pad'].restitution).toBeCloseTo(pad);
    expect(after.values['cup-base'].restitution).toBeCloseTo(cup);
  });
  it('applies friction globally but preserves existing independent bounce values', () => {
    const after = applyRules(initialRules(catchCup), [{ type: 'set_property', target: 'world', property: 'friction', value: .2 }], context);
    expect(after.values['cup-base']).toEqual({ restitution: 1.05, friction: .2 });
    expect(after.values['launch-pad'].restitution).toBe(.1);
    expect(after.values['cup-left'].friction).toBe(.3);
  });
  it('respects property-specific permissions and does not leave partial changes after failure', () => {
    const restricted = structuredClone(context);
    restricted.targets.find(target => target.id === 'cup-base')!.editableProperties = ['friction'];
    const before = initialRules(catchCup);
    expect(applyRules(before, [set('world', .8)], restricted).values['cup-base'].restitution).toBe(1.05);
    expect(() => applyRules(before, [set('world', .8), set('cup-left', .9)], context)).toThrow();
    expect(before.values['launch-pad'].restitution).toBe(.1);
  });
});
