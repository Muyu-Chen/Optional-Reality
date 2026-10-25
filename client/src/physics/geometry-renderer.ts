import type { Point } from '../levels/types';
import type { PhysicsWorld } from './world';
import { drawActor } from './actor-renderer';
import { drawGoal } from './goal-renderer';
import { drawSurface } from './surface-renderer';
import { drawGeometrySprings } from './spring-renderer';

// Each layer reads the same world; no level-specific gameplay lives in drawing.
export function drawGeometry(ctx: CanvasRenderingContext2D, world: PhysicsWorld, trail: readonly Point[]) {
  const {level}=world, {width,height}=level.viewport;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.fillStyle='#d6dfce';
  for(let x=18;x<width;x+=28)for(let y=18;y<height;y+=28){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#c7d1be';ctx.lineWidth=1.5;
  for(const line of level.guideLines){ctx.beginPath();ctx.moveTo(...line.from);ctx.lineTo(...line.to);ctx.stroke();}
  drawGoal(ctx,world);
  for(const track of level.tracks)drawSurface(ctx,track,world.rules);
  drawGeometrySprings(ctx,world);
  if(trail.length>1){ctx.lineWidth=2;ctx.strokeStyle='#8ca47a99';ctx.setLineDash([2,7]);ctx.beginPath();trail.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);}
  drawActor(ctx,world);
  if(level.failOnFall) {
    ctx.fillStyle='#b15b4b';ctx.fillRect(0,height-3,width,3);ctx.font='12px ui-monospace,monospace';
    ctx.fillText('FALL = TRY AGAIN',42,height-12);
  }
  ctx.restore();
}
