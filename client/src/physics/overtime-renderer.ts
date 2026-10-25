import type { PhysicsWorld } from './world';

export function drawOvertimeBoundary(ctx:CanvasRenderingContext2D,world:PhysicsWorld,reduced=false) {
  if(!world.overtime)return;
  const {width,height}=world.level.viewport;
  const fade=reduced?1:Math.min(1,(world.tick-world.limitTicks+1)/60);
  ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle='#488ba35c';ctx.lineWidth=12;
  ctx.strokeRect(3,3,width-6,height-6);
  ctx.strokeStyle='#427e9d9c';ctx.lineWidth=2;ctx.setLineDash([7,8]);ctx.strokeRect(5,5,width-10,height-10);ctx.setLineDash([]);
  ctx.restore();
}
