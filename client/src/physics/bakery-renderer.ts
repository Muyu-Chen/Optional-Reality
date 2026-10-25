import type { Point } from '../levels/types';
import type { PhysicsWorld } from './world';
import { bakeryText, strokePath, type Ctx } from './bakery/drawing';
import { drawBread } from './bakery/bread';
import { drawBakeryDevice } from './bakery/devices';
import { drawBakeryRoom } from './bakery/room';

// Rendering reads the Matter.js world; no simulation or command parser lives here.
export function drawBakery(ctx: Ctx, world: PhysicsWorld, trail: readonly Point[]) {
  const { level } = world;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawBakeryRoom(ctx);
  for (const device of level.devices || []) drawBakeryDevice(ctx, device, world);
  if (trail.length > 1) {
    ctx.setLineDash([2, 7]);
    strokePath(ctx, trail, '#9b784c99', 1.7);
    ctx.setLineDash([]);
  }
  const { x, y } = world.ball.position;
  drawBread(ctx, x, y, level.ball.radius, world.ball.angle);
  if (!world.started) bakeryText(ctx, 'START', 143, 389, 10, '#806d51', '600');
  bakeryText(ctx, 'THE LAST ORDER / CHANGE THE RULES. CHOOSE THE MOMENT.', 27, 530, 10, '#806d51');
}
