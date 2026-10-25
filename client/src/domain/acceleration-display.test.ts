import { describe, expect, it } from 'vitest';
import { accelerationDisplay, sameAcceleration } from './acceleration-display';

describe('acceleration vector display model', () => {
  it.each([
    [0, 0, 'zero', 0, '0'],
    [2, 0, 'right', 0, '2'],
    [-2, 0, 'left', 180, '2'],
    [0, 2, 'down', 90, '2'],
    [0, -2, 'up', -90, '2'],
    [3, 4, 'down-right', 53.13010235415598, '(3, 4)'],
    [-3, 4, 'down-left', 126.86989764584402, '(-3, 4)'],
    [-3, -4, 'up-left', -126.86989764584402, '(-3, -4)'],
    [3, -4, 'up-right', -53.13010235415598, '(3, -4)'],
  ] as const)('maps screen-coordinate acceleration (%s, %s) to %s', (x, y, direction, angle, value) => {
    const view = accelerationDisplay(Object.freeze({ x, y }));
    expect(view.direction).toBe(direction);expect(view.angleDegrees).toBeCloseTo(angle);
    expect(view.value).toBe(value);expect(view.accessibleLabel).toContain('meters per second squared');
  });

  it('makes diagonal magnitude and signed components readable without treating gravity as another force', () => {
    expect(accelerationDisplay({ x: 3, y: -4 }).accessibleLabel)
      .toBe('Acceleration: 5 meters per second squared, up and right. Components x 3, y -4.');
  });

  it('ignores arithmetic roundoff but preserves real small changes and direction reversals', () => {
    expect(sameAcceleration({ x: .3, y: .9 }, { x: .1 + .2, y: .3 * 3 })).toBe(true);
    expect(sameAcceleration({ x: -0, y: 0 }, { x: 0, y: -0 })).toBe(true);
    expect(sameAcceleration({ x: 1e-10, y: 0 }, { x: 2e-10, y: 0 })).toBe(false);
    expect(sameAcceleration({ x: 0, y: 2 }, { x: 0, y: -2 })).toBe(false);
    expect(accelerationDisplay({ x: 1e-10, y: 0 }).value).toBe('1e-10');
  });

  it('never labels an invalid telemetry value as zero acceleration', () => {
    const view = accelerationDisplay({ x: Number.NaN, y: 0 });
    expect(view.direction).toBe('unavailable');expect(view.value).toBe('—');
    expect(view.accessibleLabel).toBe('Acceleration unavailable.');
  });
});
