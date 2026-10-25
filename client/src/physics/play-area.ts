import type Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';

export type PlayAreaEdge = 'left' | 'right' | 'top' | 'bottom';
export interface PlayAreaBounds { left: number; right: number; top: number; bottom: number }

/** Rescue space for changing course; the level geometry stays at its original coordinates. */
export function playAreaBounds(level: Pick<LevelDefinition, 'viewport'>, overtime = false): PlayAreaBounds {
  const { width, height } = level.viewport;
  return { left: 0, right: width * (overtime ? 1.2 : 1), top: overtime ? -height * .2 : 0, bottom: height };
}

/** Visible geometry only: Matter's cached bounds also contain a velocity margin. */
export function actorBounds(body: Matter.Body, level: Pick<LevelDefinition, 'ball'>) {
  if (!level.ball.shape) {
    const { x, y } = body.position, r = level.ball.radius;
    return { min: { x: x-r, y: y-r }, max: { x: x+r, y: y+r } };
  }
  return {
    min: { x: Math.min(...body.vertices.map(v => v.x)), y: Math.min(...body.vertices.map(v => v.y)) },
    max: { x: Math.max(...body.vertices.map(v => v.x)), y: Math.max(...body.vertices.map(v => v.y)) },
  };
}

/** A partly visible actor can still be saved; leaving completely ends the attempt. */
export function outsidePlayArea(body: Matter.Body, level: Pick<LevelDefinition, 'ball' | 'viewport'>, area = playAreaBounds(level)): PlayAreaEdge | null {
  const { min, max } = actorBounds(body, level);
  if (max.x < area.left) return 'left';
  if (min.x > area.right) return 'right';
  if (max.y < area.top) return 'top';
  if (min.y > area.bottom) return 'bottom';
  return null;
}
