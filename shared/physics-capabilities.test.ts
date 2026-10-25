import { accelerationAxis } from './acceleration';
import { describe, expect, it } from 'vitest';
import { levels } from '../client/src/levels/catalog';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { prepareMessage } from '../client/src/domain/queue';
import { ENVIRONMENT_PROPERTIES, PHYSICS_CAPABILITIES, propertiesForTarget } from './physics-capabilities';
import { applyRules, type Operation } from './rules';

describe('universal environment capabilities', () => {
  it.each(levels)('prepares the reported typo locally and applies horizontal acceleration in $id', level => {
    const current = initialRules(level), context = ruleContext(level);
    const message = prepareMessage('reported', 'add accelation to right', context, current);
    expect(message).toMatchObject({ status: 'ready', source: 'local', understoodAs: 'add acceleration to right',
      operation: { type: 'set_property', target: 'world', property: 'acceleration_x', value: 1 } });
    const next = applyRules(current, [message.operation], context);
    expect(next.acceleration.x).toBe(1);
    expect(current.acceleration.x).toBe(0);
  });
  it.each(levels)('uses the shared limits for every base property in $id', level => {
    const current = initialRules(level), context = ruleContext(level);
    expect(context.targets[0].properties).toEqual(propertiesForTarget('environment'));
    for (const property of ENVIRONMENT_PROPERTIES) {
      const [minimum, maximum] = PHYSICS_CAPABILITIES[property].range;
      for (const [requested, actual] of [[minimum - 100, minimum], [maximum + 100, maximum]]) {
        const operation: Operation = { type: 'set_property', target: 'world', property, value: requested };
        const next = applyRules(current, [operation], context);
        expect(accelerationAxis(property) ? next.acceleration[accelerationAxis(property)!] : next.values.world[property]).toBe(actual);
      }
    }
  });
  it('does not turn the shared vocabulary into nonexistent device or actor permissions', () => {
    const level = levels[0], context = ruleContext(level), current = initialRules(level);
    expect(prepareMessage('missing', 'set fan power to 1', context, current).status).toBe('error');
    for (const target of ['world', 'ball-A', 'imaginary-fan']) {
      expect(() => applyRules(current, [{ type: 'set_property', target, property: 'fan_power', value: 1 }], context)).toThrow();
    }
    expect(propertiesForTarget('ball')).toEqual({});
  });
});
