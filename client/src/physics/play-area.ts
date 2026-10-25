import type Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';

export type PlayAreaEdge = 'left' | 'right' | 'top' | 'bottom';

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
export function outsidePlayArea(body: Matter.Body, level: Pick<LevelDefinition, 'ball' | 'viewport'>): PlayAreaEdge | null {
  const { min, max } = actorBounds(body, level);
  if (max.x < 0) return 'left';
  if (min.x > level.viewport.width) return 'right';
  if (max.y < 0) return 'top';
  if (min.y > level.viewport.height) return 'bottom';
  return null;
}
