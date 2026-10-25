import { describe, expect, it } from 'vitest';
import { CompilationMessageSchema, compileModelMessage } from './compilation-message';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { gravityLab } from '../client/src/levels/gravity-lab';

const context = ruleContext(gravityLab);
const current = () => ({ ...initialRules(gravityLab), acceleration: { x: 0, y: 2 } });
const original = { id: 'm', text: 'Make a change.' };
const setY = (value: number) => ({ type: 'set_property', target: 'world', property: 'acceleration_y', value });
const row = (operations: unknown[], error: string | null = null) => ({ id: 'm', operations, error });

describe('isolated compilation message validation', () => {
  it.each([
    row([], 'The ball color cannot be changed.'),
    row([setY(50)], 'Unsupported second intent.'),
    row([]),
    row([{ type: 'set_property', target: 'ball-A', property: 'friction', value: 0 }]),
    row([{ type: 'set_property', target: 'missing', property: 'friction', value: 0 }]),
    row([{ type: 'add_sensor_trigger', sensor: 'missing', gate: 'missing' }]),
    row([{ type: 'set_gravity', acceleration: Infinity }]),
    row([{ type: 'eval', code: 'arbitrary code' }]),
    row(Array.from({ length: 17 }, () => setY(1))),
    { id: 'm', operations: 'not an array', error: null },
    { id: 'm', operations: [setY(1)], error: '   ' },
  ])('returns a bounded, non-executable error without changing state: %#', candidate => {
    const before = current(), snapshot = structuredClone(before);
    const result = compileModelMessage(candidate, original, before, context);
    expect(result.message).toMatchObject({ id: 'm', operations: [], error: expect.any(String) });
    expect(CompilationMessageSchema.safeParse(result.message).success).toBe(true);
    expect(result.state).toBe(before); expect(before).toEqual(snapshot);
  });

  it('discards all intents in a failed message before validating a later relative operation', () => {
    const before = current();
    const failed = compileModelMessage(row([setY(50), { type: 'set_property', target: 'ball-A', property: 'friction', value: 0 }]), original, before, context);
    const relative = { type: 'scale_property', target: 'world', property: 'acceleration_y', factor: -1 };
    const next = compileModelMessage(row([relative]), original, failed.state, context);
    expect(failed.message).toMatchObject({ operations: [], error: expect.any(String) });
    expect(next.message.operations).toEqual([relative]);
    expect(next.state.acceleration.y).toBe(-2);
    expect(before.acceleration.y).toBe(2);
  });

  it('keeps actual limit feedback and corrections on a successful message', () => {
    const result = compileModelMessage({ ...row([setY(1000)]), understoodAs: 'Acceleration downward 1000.' }, original, current(), context);
    expect(result.message).toMatchObject({
      operations: [setY(100)], understoodAs: 'Acceleration downward 1000.',
      adjustments: [{ requested: 1000, applied: 100 }],
    });
    expect(result.state.acceleration.y).toBe(100);
  });

  it('rolls back a message that exceeds the total trigger limit after modifying another property', () => {
    const sensors = Array.from({ length: 25 }, (_, i) => `sensor-${i}`);
    const expanded = { ...context, sensors, gates: ['gate'] };
    const before = { ...current(), triggers: sensors.slice(0, 24).map(sensor => ({ sensor, gate: 'gate' })) };
    const failed = compileModelMessage(row([setY(50), { type: 'add_sensor_trigger', sensor: sensors[24], gate: 'gate' }]), original, before, expanded);
    expect(failed.message).toMatchObject({ operations: [], error: expect.any(String) });
    expect(failed.state).toBe(before); expect(before.acceleration.y).toBe(2); expect(before.triggers).toHaveLength(24);
    const next = compileModelMessage(row([{ type: 'reverse_gravity' }]), original, failed.state, expanded);
    expect(next.state.acceleration.y).toBe(-2); expect(next.state.triggers).toHaveLength(24);
  });

  it.each([
    { id: 'm', operations: [], error: '' },
    { id: 'm', operations: [setY(1)], error: 'Do not execute.' },
    { id: 'm', operations: [] },
  ])('rejects contradictory or empty public results: %#', result => {
    expect(CompilationMessageSchema.safeParse(result).success).toBe(false);
  });
});
