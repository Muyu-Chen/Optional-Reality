import { accelerationAxis } from './acceleration';
import { describe, expect, it } from 'vitest';
import { levels } from '../client/src/levels/catalog';
import { realityBreakdown } from '../client/src/levels/reality-breakdown';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { applyRules, RuleStateSchema, type PropertyName, type RuleContext } from './rules';

const context = ruleContext(realityBreakdown);
const properties = context.targets.flatMap(target => Object.entries(target.properties).map(([property, range]) => ({
  target: target.id, property: property as PropertyName, range: range!,
})));

describe('rule ranges and permissions', () => {
  it.each(properties)('accepts endpoints, clips finite overflow and rejects nonfinite $target.$property atomically', ({ target, property, range }) => {
    const current = initialRules(realityBreakdown), before = structuredClone(current);
    const set = (value: number) => ({ type: 'set_property', target, property, value });
    for (const value of range) expect(() => applyRules(current, [set(value)], context)).not.toThrow();
    for (const value of [range[0] - .001, range[1] + .001]) {
      const next=applyRules(current,[set(value)],context),applied=target === 'world' && accelerationAxis(property) ? next.acceleration[accelerationAxis(property)!] : next.values[target]?.[property];
      expect(applied).toBe(Math.max(range[0],Math.min(range[1],value)));expect(current).toEqual(before);
    }
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(() => applyRules(current, [{ type: 'set_gravity', acceleration: 2 }, set(value)], context)).toThrow();
      expect(current).toEqual(before);
    }
  });

  it.each(levels)('enforces every declared read-only property in $id while accepting its initial state', level => {
    const current = initialRules(level), context = ruleContext(level);
    expect(() => applyRules(current, [], context)).not.toThrow();
    for (const target of context.targets) for (const [property, range] of Object.entries(target.properties)) {
      const operation = { type: 'set_property', target: target.id, property, value: (range![0] + range![1]) / 2 };
      if (target.editableProperties && !target.editableProperties.includes(property as PropertyName)) {
        expect(() => applyRules(current, [operation], context)).toThrow('cannot be edited');
      } else expect(() => applyRules(current, [operation], context)).not.toThrow();
    }
  });

  it('reads inherited surface values at execution and rejects scaling an unset device property', () => {
    const state = initialRules(realityBreakdown);
    const doubleFloor = { type: 'scale_property', target: 'factory-floor', property: 'friction', factor: 2 };
    const first = applyRules(state, [doubleFloor], context);
    expect(first.values['factory-floor'].friction).toBe(.24);
    const next = applyRules(first, [doubleFloor], context);
    expect(next.values['factory-floor'].friction).toBe(.48);
    delete state.values['fan-main'].fan_power;
    expect(() => applyRules(state, [{ type: 'scale_property', target: 'fan-main', property: 'fan_power', factor: 2 }], context)).toThrow('finite');
  });

  it('normalizes negative zero for set and relative operations', () => {
    const state = initialRules(realityBreakdown);
    const next = applyRules(state, [
      { type: 'set_gravity', acceleration: -0 }, { type: 'reverse_gravity' },
      { type: 'set_property', target: 'fan-main', property: 'fan_power', value: -0 },
    ], context);
    expect(Object.is(next.acceleration.y, -0)).toBe(false);
    expect(Object.is(next.values['fan-main'].fan_power, -0)).toBe(false);
  });

  it('deduplicates sensor links and never returns a state beyond the trigger limit', () => {
    const sensors = Array.from({ length: 25 }, (_, i) => `sensor-${i}`);
    const many: RuleContext = { ...context, sensors, gates: ['gate'] };
    const initial = initialRules(realityBreakdown);
    const links = sensors.map(sensor => ({ type: 'add_sensor_trigger', sensor, gate: 'gate' }));
    const atLimit = applyRules(initial, links.slice(0, 24), many);
    expect(atLimit.triggers).toHaveLength(24);
    expect(RuleStateSchema.safeParse(atLimit).success).toBe(true);
    expect(applyRules(atLimit, [links[0]], many).triggers).toHaveLength(24);
    expect(() => applyRules(atLimit, [links[24]], many)).toThrow();
    expect(atLimit.triggers).toHaveLength(24);
    expect(initial.triggers).toEqual([]);
  });
});
