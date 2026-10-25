import type { Operation } from './rules';

export interface AccelerationVector { x: number; y: number }
export const ACCELERATION_RANGE = [-100, 100] as const;
export const accelerationAxis = (property: string) => property === 'acceleration_x' ? 'x'
  : property === 'acceleration_y' || property === 'gravity' ? 'y' : undefined;

// Old command names are input aliases. There is only one vector in rule state.
export type CanonicalOperation = Exclude<Operation, {type:'set_gravity'} | {type:'reverse_gravity'}>;
export function normalizeAccelerationOperation(operation: Operation): CanonicalOperation {
  if (operation.type === 'set_gravity') return {type:'set_property',target:'world',property:'acceleration_y',value:operation.acceleration};
  if (operation.type === 'reverse_gravity') return {type:'scale_property',target:'world',property:'acceleration_y',factor:-1};
  if ((operation.type === 'set_property' || operation.type === 'scale_property') && operation.property === 'gravity') return {...operation,property:'acceleration_y'};
  return operation;
}

export function accelerationLabel({x,y}: AccelerationVector): string {
  const number = (value: number) => Number(value.toFixed(3));
  if (!x && !y) return 'a = 0';
  if (!x) return `a ${y > 0 ? '↓' : '↑'} ${number(Math.abs(y))} m/s²`;
  if (!y) return `a ${x > 0 ? '→' : '←'} ${number(Math.abs(x))} m/s²`;
  return `a = (${number(x)}, ${number(y)}) m/s²`;
}
