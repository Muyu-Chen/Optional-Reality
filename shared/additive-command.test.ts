import { describe, expect, it } from 'vitest';
import { additiveIntent, checkAdditiveMeaning, parseAdditiveCommand } from './additive-command';
import { parseCommand, describeOperation } from './commands';
import { applyRules, OperationSchema, type Operation } from './rules';
import { limitAbsoluteOperation } from './rule-limits';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { bounce } from '../client/src/levels/bounce';
import { catchCup } from '../client/src/levels/catch-cup';
import { compileModelMessage } from './compilation-message';
import { appliedFeedback } from '../client/src/domain/feedback';

const context = ruleContext(bounce);
const add = (amount: number, target = 'world', property: 'restitution' | 'acceleration_y' = 'restitution'): Operation => ({ type: 'add_property', target, property, amount });

describe('additive commands preserve arithmetic', () => {
  it.each(['surface bounce +2', 'surface bounce +=2', '地面弹力+2', '弹性增加2', 'increase surface bounce by 2'])('prepares addition, never multiplication: %s', text => {
    expect(parseCommand(text, context)).toEqual({ operation: add(2) });
  });
  it.each(['bounce -=0.2', 'decrease bounce by 0.2', '弹性减少0.2', 'bounce + -0.2'])('retains an explicit subtraction: %s', text => {
    expect(parseCommand(text, context)).toEqual({ operation: add(-.2) });
  });
  it('resolves a named local surface and preserves the gravity alias as one component', () => {
    expect(parseCommand('launch pad bounce +0.2', ruleContext(catchCup))).toEqual({ operation: add(.2, 'launch-pad') });
    expect(parseCommand('gravity +2', context)).toEqual({ operation: add(2, 'world', 'acceleration_y') });
  });
  it.each(['set bounce to 2', 'gravity = +2', 'vertical acceleration -2', 'set gravity to +2', 'double bounce'])('does not turn an assignment or multiplier into addition: %s', text => {
    expect(additiveIntent(text)).toBeUndefined();
    expect(parseAdditiveCommand(text, context)).toBeUndefined();
  });
  it('keeps unknown targets and extra words out of local Ready results', () => {
    expect(parseAdditiveCommand('padding 弹力+2', context)).toHaveProperty('error');
    expect(parseAdditiveCommand('ball bounce +2', context)).toHaveProperty('error');
    expect(parseAdditiveCommand('bounce +1e999', context)).toHaveProperty('error');
    expect(parseCommand('bounce +2 then paint the ball red', context)).toHaveProperty('error');
  });
  it('reads actual values when sent, rather than freezing a prepared result', () => {
    const operation = add(.2), before = initialRules(bounce);
    const changed = applyRules(before, [{ type: 'set_property', target: 'world', property: 'restitution', value: .8 }], context);
    expect(limitAbsoluteOperation(operation, context)).toEqual({ operation });
    expect(applyRules(changed, [operation], context).values.world.restitution).toBe(1);
    expect(before.values.world.restitution).toBe(.1);
    expect(describeOperation(add(2)).title).toBe('restitution + 2');
    expect(describeOperation(add(-.2)).title).toBe('restitution − 0.2');
  });
  it('clamps the resolved sum and reports the actual result', () => {
    const before = initialRules(bounce), operation = add(2);
    const after = applyRules(before, [operation], context);
    expect(after.values.world.restitution).toBe(1.5);
    expect(appliedFeedback([operation], before, after, bounce)).toEqual(['Surface bounce increased to 1.5 (limited from 2.1).']);
    expect(applyRules(before, [add(-2)], context).values.world.restitution).toBe(0);
  });
  it('inherits a global material only when no local override exists', () => {
    const before = initialRules(bounce);
    expect(applyRules(before, [add(.2, 'bounce-floor')], context).values['bounce-floor'].restitution).toBeCloseTo(.3);
    const cup = initialRules(catchCup);
    expect(applyRules(cup, [add(.2, 'launch-pad')], ruleContext(catchCup)).values['launch-pad'].restitution).toBeCloseTo(.3);
    expect(cup.values['cup-base'].restitution).toBe(1.05);
  });
  it('checks schema, permissions, missing values and atomicity for additive operations', () => {
    expect(OperationSchema.safeParse(add(Infinity)).success).toBe(false);
    const before = initialRules(catchCup), context = ruleContext(catchCup);
    expect(() => applyRules(before, [add(.2, 'cup-left')], context)).toThrow(/edited/);
    expect(() => applyRules(before, [add(.2, 'ball-A')], context)).toThrow();
    expect(() => applyRules(before, [add(.2), add(.2, 'missing')], context)).toThrow();
    expect(before.values.world.restitution).toBe(0);
    expect(() => applyRules({ ...initialRules(bounce), values: {} }, [add(1)], ruleContext(bounce))).toThrow(/finite/);
  });
  it('rejects a model changing +2 into ×2 or an absolute 2, without affecting other messages', () => {
    for (const operation of [
      { type: 'scale_property', target: 'world', property: 'restitution', factor: 2 },
      { type: 'set_property', target: 'world', property: 'restitution', value: 2 },
      add(3),
    ]) {
      const before = initialRules(bounce);
      const result = compileModelMessage({ id: 'm', operations: [operation], error: null }, { id: 'm', text: 'padding 弹力+2' }, before, context);
      expect(result.message).toHaveProperty('error');expect(result.state).toBe(before);
    }
    expect(() => checkAdditiveMeaning('padding 弹力+2', [add(2)])).not.toThrow();
  });
  it('hands combined arithmetic to AI without accepting a local absolute-value prefix', () => {
    expect(parseCommand('stop gravity and bounce +2', context)).toHaveProperty('error');
    expect(parseCommand('bounce +2 and stop gravity', context)).toHaveProperty('error');
    expect(() => checkAdditiveMeaning('stop gravity and bounce +2', [{ type: 'set_gravity', acceleration: 0 }, add(2)])).not.toThrow();
    expect(() => checkAdditiveMeaning('stop gravity and bounce +2', [{ type: 'set_gravity', acceleration: 0 }, { type: 'scale_property', target: 'world', property: 'restitution', factor: 2 }])).toThrow();
  });
  it('checks every explicit additive clause without treating signed assignments as increments', () => {
    const friction: Operation = { type: 'add_property', target: 'world', property: 'friction', amount: 2 };
    expect(() => checkAdditiveMeaning('bounce +2; friction +2', [add(2)])).toThrow();
    expect(() => checkAdditiveMeaning('bounce +2; friction +2', [add(2), friction])).not.toThrow();
    expect(() => checkAdditiveMeaning('gravity = +2; bounce +2', [{ type: 'set_gravity', acceleration: 2 }, add(2)])).not.toThrow();
  });
});
