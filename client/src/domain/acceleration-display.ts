import type { AccelerationVector } from '../../../shared/acceleration';

export type AccelerationDirection = 'zero' | 'up' | 'down' | 'left' | 'right'
  | 'up-left' | 'up-right' | 'down-left' | 'down-right' | 'unavailable';
export interface AccelerationDisplay {
  key: string;
  direction: AccelerationDirection;
  angleDegrees: number;
  value: string;
  accessibleLabel: string;
}

// Rules can arrive through relative arithmetic. Ignore binary floating-point noise,
// while preserving genuinely small accelerations and explicit direction changes.
const stable = (value: number) => Number.isFinite(value) ? Number(value.toPrecision(12)) : value;
const number = (value: number) => String(Number(value.toPrecision(4)));
const directionWords: Record<Exclude<AccelerationDirection, 'unavailable' | 'zero'>, string> = {
  up: 'upward', down: 'downward', left: 'leftward', right: 'rightward',
  'up-left': 'up and left', 'up-right': 'up and right',
  'down-left': 'down and left', 'down-right': 'down and right',
};

export function accelerationDisplay(acceleration: Readonly<AccelerationVector>): AccelerationDisplay {
  const x = stable(acceleration.x), y = stable(acceleration.y), key = `${x},${y}`;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { key, direction: 'unavailable', angleDegrees: 0, value: '—', accessibleLabel: 'Acceleration unavailable.' };
  }
  if (x === 0 && y === 0) return {
    key, direction: 'zero', angleDegrees: 0, value: '0',
    accessibleLabel: 'Acceleration: zero, 0 meters per second squared.',
  };
  const direction: Exclude<AccelerationDirection, 'unavailable' | 'zero'> = x === 0 ? y > 0 ? 'down' : 'up'
    : y === 0 ? x > 0 ? 'right' : 'left' : `${y > 0 ? 'down' : 'up'}-${x > 0 ? 'right' : 'left'}`;
  const diagonal = x !== 0 && y !== 0, magnitude = number(Math.hypot(x, y));
  return {
    key, direction, angleDegrees: Math.atan2(y, x) * 180 / Math.PI,
    value: diagonal ? `(${number(x)}, ${number(y)})` : magnitude,
    accessibleLabel: `Acceleration: ${magnitude} meters per second squared, ${directionWords[direction]}.${diagonal ? ` Components x ${number(x)}, y ${number(y)}.` : ''}`,
  };
}

export function sameAcceleration(before: Readonly<AccelerationVector>, after: Readonly<AccelerationVector>) {
  return accelerationDisplay(before).key === accelerationDisplay(after).key;
}
