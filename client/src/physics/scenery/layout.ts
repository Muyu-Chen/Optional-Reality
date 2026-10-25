import type { LevelDefinition } from '../../levels/types';

export type SceneryTheme = 'valley' | 'cosmos';
// Illustration coordinates are independent from collision/world coordinates.
export const sceneryLayout = Object.freeze({ width: 1000, height: 700, roadY: 612,
  waterfall: Object.freeze({ x: 128, y: 353, width: 35, poolY: 580 }),
});

export function sceneryTheme(level: Pick<LevelDefinition, 'initialAcceleration'>): SceneryTheme {
  return Math.hypot(...level.initialAcceleration) < .001 ? 'cosmos' : 'valley';
}

// Stable hand-placed stars avoid per-frame randomness or global random state.
export const distantStars = Object.freeze(Array.from({ length: 68 }, (_, i) => Object.freeze({
  x: ((i * 173 + 41) % 997), y: ((i * 97 + 19) % 541) + 82,
  radius: i % 7 === 0 ? 2.2 : 1.1,
})));
