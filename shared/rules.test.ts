import { describe, expect, it } from 'vitest';
import { applyRules } from './rules';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { realityBreakdown } from '../client/src/levels/reality-breakdown';
import { gravityLab } from '../client/src/levels/gravity-lab';
import { parseCommand } from './commands';
import { applyBatch, prepareMessage } from '../client/src/domain/queue';

const context = ruleContext(realityBreakdown);
describe('environment rule semantics', () => {
  it('keeps relative operations relative until execution, and validates the final range', () => {
    const state = initialRules(realityBreakdown);
    state.values['belt-main'].conveyor_speed = 1;
    const operations = [{ type: 'scale_property', target: 'belt-main', property: 'conveyor_speed', factor: 2 }];
    expect(applyRules(state, operations, context).values['belt-main'].conveyor_speed).toBe(2);
    state.values['belt-main'].conveyor_speed = 2;
    expect(applyRules(state, operations, context).values['belt-main'].conveyor_speed).toBe(3);
    state.values.world.friction = .2;
    expect(applyRules(state, [{ type: 'scale_property', target: 'factory-floor', property: 'friction', factor: 2 }], context).values['factory-floor'].friction).toBe(.4);
  });
  it('validates every intent in a message before consuming it', () => {
    const messages = [{ id: 'multi', text: 'two intents', status: 'ready' as const, operations: [
      { type: 'set_gravity' as const, acceleration: 2 },
      { type: 'set_property' as const, target: 'world', property: 'restitution' as const, value: .7 },
    ] }];
    const state = initialRules(realityBreakdown);
    const result = applyBatch(messages, ['multi'], state, 5, context);
    expect(result.rules.gravity).toBe(2);
    expect(result.rules.values.world.restitution).toBe(.7);
    expect(result.events).toHaveLength(1);
    expect(state.gravity).toBe(8);
    expect(result.messages[0].status).toBe('sent');
  });
  it('rejects core edits, direct gate edits, foreign devices, and nonfinite values', () => {
    const state = initialRules(realityBreakdown);
    for (const operation of [
      { type: 'set_property', target: 'energy-core', property: 'friction', value: .2 },
      { type: 'set_property', target: 'gate-final', property: 'angular_speed', value: 1 },
      { type: 'set_property', target: 'fake-fan', property: 'fan_power', value: 1 },
      { type: 'set_gravity', acceleration: NaN },
    ]) expect(() => applyRules(state, [operation], context)).toThrow();
  });
  it('does not misparse compound, timed, or out-of-range local messages', () => {
    expect(parseCommand('Set gravity to 2 and bounce to 0.7', context).error).toBeDefined();
    expect(parseCommand('Set gravity to 1 for 2 seconds', context).error).toBeDefined();
    expect(parseCommand('Set core friction to 0', context).error).toBeDefined();
    expect(prepareMessage('id', 'Set fan power to 999', context, initialRules(realityBreakdown))).toMatchObject({status:'ready',operation:{value:2},adjustments:[{requested:999,applied:2}]});
    expect(parseCommand('Set fan power to .45', context).operation).toMatchObject({ value: .45 });
    const rotorContext={...context,targets:[...context.targets,{id:'rotor-test',kind:'rotor',properties:{angular_speed:[-3,3] as const}}]};
    expect(parseCommand('Make the wheel spin counterclockwise at speed 1', rotorContext).operation).toMatchObject({ value: -1 });
  });
});
