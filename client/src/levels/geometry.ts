import type { Point } from './types';

export function cubicBezier(points: readonly [Point, Point, Point, Point], steps: number): Point[] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps, u = 1 - t;
    const coordinate = (axis: 0 | 1) => u ** 3 * points[0][axis]
      + 3 * u ** 2 * t * points[1][axis]
      + 3 * u * t ** 2 * points[2][axis]
      + t ** 3 * points[3][axis];
    return [coordinate(0), coordinate(1)];
  });
}
