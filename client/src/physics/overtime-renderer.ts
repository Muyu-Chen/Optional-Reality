import type { PhysicsWorld } from './world';
import { overtimeReveal } from './overtime';

export function drawOvertimeBoundary(ctx:CanvasRenderingContext2D,world:PhysicsWorld,reduced=false) {
  if(!world.overtime)return;
  const {left,right,top,bottom}=world.playArea;
  const width=right-left,height=bottom-top;
  const fade=overtimeReveal(world,reduced);
  ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle='#488ba35c';ctx.lineWidth=12;
  ctx.strokeRect(left+3,top+3,width-6,height-6);
  ctx.strokeStyle='#427e9d9c';ctx.lineWidth=2;ctx.setLineDash([7,8]);ctx.strokeRect(left+5,top+5,width-10,height-10);ctx.setLineDash([]);
  ctx.restore();
}
