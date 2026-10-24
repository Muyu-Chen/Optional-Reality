import type { Operation, RuleState } from '../../../shared/rules';
import type { LevelDefinition } from '../levels/types';

const number = (value: number) => Number(value.toFixed(3)).toString();

// Captions describe the applied state, including relative commands resolved at send time.
export function appliedFeedback(operations: readonly Operation[], before: RuleState, after: RuleState, level: LevelDefinition): string[] {
  const changes = new Map<string,string>();
  for (const operation of operations) {
    if (operation.type === 'add_sensor_trigger') {
      changes.set('trigger:'+operation.sensor, level.presentation === 'bakery' ? 'The pickup bell will open the shutter.' : 'Sensor contact will open the gate.');
      continue;
    }
    const property = operation.type === 'set_gravity' || operation.type === 'reverse_gravity' ? 'gravity' : operation.property;
    const target = operation.type === 'set_gravity' || operation.type === 'reverse_gravity' ? 'world' : operation.target;
    if (property === 'gravity') {
      changes.set('gravity',after.gravity === 0 ? 'Gravity turned off. Momentum remains.' : `Gravity now pulls ${after.gravity > 0 ? 'downward' : 'upward'} at ${number(Math.abs(after.gravity))} m/s².`);
      continue;
    }
    const value = after.values[target]?.[property];
    if (value === undefined) continue;
    const prior = before.values[target]?.[property];
    const kind = level.devices?.find(device => device.id === target)?.kind;
    const name = kind === 'conveyor' ? 'Conveyor speed' : kind === 'spring' ? 'Toaster power' : kind === 'fan' ? 'Fan power' : kind === 'rotor' ? 'Wheel speed' : property === 'friction' ? 'Surface friction' : 'Surface bounce';
    const change = prior === undefined || prior === value ? 'set' : value > prior ? 'increased' : 'decreased';
    changes.set(target+':'+property,`${name} ${change} to ${number(value)}.`);
  }
  return [...changes.values()];
}
