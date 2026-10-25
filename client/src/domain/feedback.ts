import type { Operation, RuleState } from '../../../shared/rules';
import type { LevelDefinition } from '../levels/types';
import { accelerationAxis, normalizeAccelerationOperation } from '../../../shared/acceleration';

const number = (value: number) => Number(value.toFixed(3)).toString();

function limitingNote(operation: Operation, before: RuleState, actual: number, level: LevelDefinition) {
  if (operation.type !== 'scale_property') return '';
  const axis = accelerationAxis(operation.property);
  const prior = axis ? before.acceleration[axis] : before.values[operation.target]?.[operation.property]
    ?? (level.tracks.some(track => track.id === operation.target) ? before.values.world?.[operation.property] : undefined);
  const requested = prior === undefined ? undefined : prior * operation.factor;
  return requested !== undefined && requested !== actual ? ` (limited from ${number(requested)})` : '';
}

// Captions describe the applied state, including relative commands resolved at send time.
export function appliedFeedback(operations: readonly Operation[], before: RuleState, after: RuleState, level: LevelDefinition): string[] {
  const changes = new Map<string,string>();
  for (const input of operations) {
    const operation = normalizeAccelerationOperation(input);
    if (operation.type === 'add_sensor_trigger') {
      changes.set('trigger:'+operation.sensor, level.presentation === 'bakery' ? 'The pickup bell will open the shutter.' : 'Sensor contact will open the gate.');
      continue;
    }
    const {property,target} = operation;
    const axis = accelerationAxis(property);
    if (axis) {
      const value = after.acceleration[axis];
      const direction = axis === 'x' ? value > 0 ? 'right' : 'left' : value > 0 ? 'downward' : 'upward';
      changes.set('acceleration_'+axis,value === 0 ? `${axis === 'x' ? 'Horizontal' : 'Vertical'} acceleration turned off. Momentum remains.` : `Acceleration now pulls ${direction} at ${number(Math.abs(value))} m/s²${limitingNote(operation,before,value,level)}.`);
      continue;
    }
    const value = after.values[target]?.[property];
    if (value === undefined) continue;
    const prior = before.values[target]?.[property];
    const kind = level.devices?.find(device => device.id === target)?.kind;
    const surface=level.tracks.find(track=>track.id===target);
    const name = surface ? `${surface.label || 'Surface'} ${property==='friction'?'friction':'bounce'}` : kind === 'conveyor' ? 'Conveyor speed' : kind === 'spring' ? 'Toaster power' : kind === 'fan' ? 'Fan power' : kind === 'rotor' ? 'Wheel speed' : property === 'friction' ? 'Surface friction' : 'Surface bounce';
    const change = prior === undefined || prior === value ? 'set' : value > prior ? 'increased' : 'decreased';
    changes.set(target+':'+property,`${name} ${change} to ${number(value)}${limitingNote(operation,before,value,level)}.`);
  }
  return [...changes.values()];
}
