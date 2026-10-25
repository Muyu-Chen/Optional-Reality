import type { Point } from '../levels/types';
import type { PhysicsWorld } from './world';
import { drawActor } from './actor-renderer';
import { drawGoal } from './goal-renderer';
import { drawSurface } from './surface-renderer';
import { drawGeometrySprings } from './spring-renderer';
import { sceneColours, sceneFonts } from './drawing-theme';
import { drawPuzzleBackdrop } from './scene-backdrop';
import type { AmbientFrame } from './ambient-scenery';

// Each layer reads the same world; no level-specific gameplay lives in drawing.
export function drawGeometry(ctx: CanvasRenderingContext2D, world: PhysicsWorld, trail: readonly Point[],ambient?:AmbientFrame,reducedMotion=false) {
  const {level}=world, {width,height}=level.viewport;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  drawPuzzleBackdrop(ctx,width,height,ambient,reducedMotion);
  drawGoal(ctx,world);
  for(const track of level.tracks)drawSurface(ctx,track,world.rules);
  drawGeometrySprings(ctx,world);
  if(trail.length>1){ctx.lineWidth=2;ctx.strokeStyle=sceneColours.trail;ctx.setLineDash([2,7]);ctx.beginPath();trail.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);}
  drawActor(ctx,world);
  if(level.failOnFall) {
    ctx.fillStyle=sceneColours.danger;ctx.fillRect(0,height-3,width,3);ctx.font=sceneFonts.small;
    ctx.fillText('Mind the gap',42,height-12);
  }
  ctx.restore();
}
