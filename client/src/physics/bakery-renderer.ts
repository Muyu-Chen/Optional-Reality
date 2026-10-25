import type { Point } from '../levels/types';
import type { PhysicsWorld } from './world';
import { bakeryText, strokePath, type Ctx } from './bakery/drawing';
import { drawBread } from './bakery/bread';
import { drawBakeryDevice } from './bakery/devices';
import { drawBakeryRoom } from './bakery/room';
import { sceneColours } from './drawing-theme';
import type { AmbientFrame } from './ambient-scenery';
import type { ActorImpactPose } from './actor-impact-pose';

// Rendering reads the Matter.js world; no simulation or command parser lives here.
export function drawBakery(ctx: Ctx, world: PhysicsWorld, trail: readonly Point[],ambient?:AmbientFrame,reducedMotion=false,actorPose?:ActorImpactPose) {
  const { level } = world;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawBakeryRoom(ctx,ambient,reducedMotion);
  for (const device of level.devices || []) drawBakeryDevice(ctx, device, world);
  if (trail.length > 1) {
    ctx.setLineDash([2, 7]);
    strokePath(ctx, trail, sceneColours.bakeryTrail, 2);
    ctx.setLineDash([]);
  }
  const { x, y } = world.ball.position;
  if (!world.won) drawBread(ctx, x, y, level.ball.radius, world.ball.angle,reducedMotion?undefined:actorPose);
  if (!world.started) bakeryText(ctx, 'START', 143, 389, 13, sceneColours.bakeryInk, '600');
  bakeryText(ctx, 'THE LAST ORDER / CHANGE THE RULES. CHOOSE THE MOMENT.', 27, 530, 12, sceneColours.bakeryInk);
}
