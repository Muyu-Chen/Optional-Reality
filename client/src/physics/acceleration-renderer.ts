import type { PhysicsWorld } from './world';
import { drawForceArrow, physicsColours } from './visual-language';

// A force-direction cue, not a velocity arrow. No simulation state is changed here.
export function drawHorizontalAcceleration(ctx: CanvasRenderingContext2D, world: PhysicsWorld) {
  const acceleration = world.rules.values.world?.acceleration_x ?? 0;
  if (!acceleration) return;
  const bakery = world.level.presentation === 'bakery';
  const x = world.level.viewport.width * (bakery ? 7/12 : .525), y = bakery ? 75 : 53;
  ctx.save();
  ctx.fillStyle = physicsColours.drive;
  ctx.font = '13px ui-monospace,monospace';
  ctx.fillText(`ACCELERATION ${acceleration > 0 ? '→' : '←'} ${Math.abs(acceleration).toFixed(1)} m/s²`,x,y);
  drawForceArrow(ctx,x+(acceleration > 0 ? 8 : 48),y+15,[acceleration,0],40,physicsColours.drive);
  ctx.restore();
}
