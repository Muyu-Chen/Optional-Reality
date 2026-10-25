import type { PhysicsWorld } from './world';
import { drawForceArrow, physicsColours } from './visual-language';
import { accelerationLabel } from '../../../shared/acceleration';
import { sceneFonts } from './drawing-theme';

// A force-direction cue, not a velocity arrow. No simulation state is changed here.
export function drawAcceleration(ctx: CanvasRenderingContext2D, world: PhysicsWorld) {
  const acceleration = world.rules.acceleration;
  const bakery = world.level.presentation === 'bakery';
  const x = bakery ? 510 : 42, y = bakery ? 43 : 53;
  ctx.save();
  ctx.fillStyle = physicsColours.gravity;
  ctx.font = sceneFonts.label;
  // Keep long diagonal-vector labels clear of the bakery's order sign.
  ctx.fillText(`ACCELERATION · ${accelerationLabel(acceleration)}`,x+30,y,bakery?235:world.level.viewport.width-x-45);
  drawForceArrow(ctx,x+7,y-7,[acceleration.x,acceleration.y],20,physicsColours.gravity);
  ctx.restore();
}
