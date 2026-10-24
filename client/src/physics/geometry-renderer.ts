import type { Point } from '../levels/types';
import type { PhysicsWorld } from './world';

// Pure-physics chapters use the same geometry for the illustration and collisions.
export function drawGeometry(ctx: CanvasRenderingContext2D, world: PhysicsWorld, trail: readonly Point[]) {
  const { level }=world;
  const {width,height}=level.viewport;
  ctx.fillStyle='#d6dfce';
  for(let x=18;x<width;x+=28)for(let y=18;y<height;y+=28){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#c7d1be';ctx.lineWidth=1.5;
  for(const line of level.guideLines){ctx.beginPath();ctx.moveTo(...line.from);ctx.lineTo(...line.to);ctx.stroke();}
  for(const track of level.tracks){
    const bounce=world.rules.values[track.id]?.restitution ?? world.rules.values.world?.restitution ?? 0;
    ctx.lineWidth=track.thickness;ctx.strokeStyle=bounce>=.75?'#7f9958':'#344b39';
    ctx.beginPath();track.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    if(level.id==='bounce'){
      ctx.fillStyle='#a6b89255';
      const y=track.points[0][1]+track.thickness/2;
      for(let x=65;x<760;x+=20){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+9,y);ctx.lineTo(x+1,y+9);ctx.lineTo(x-8,y+9);ctx.closePath();ctx.fill();}
      ctx.font='13px ui-monospace,monospace';ctx.fillStyle='#6e815d';ctx.fillText(`SURFACE BOUNCE = ${Number(bounce.toFixed(2))}`,70,y+38);
    }
  }
  if(trail.length>1){ctx.lineWidth=2;ctx.strokeStyle='#8ca47a99';ctx.setLineDash([2,7]);ctx.beginPath();trail.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);}
  const exit=level.exit;
  ctx.fillStyle=world.won?'#779957':'#344b39';ctx.beginPath();ctx.roundRect(exit.x,exit.y,exit.width,exit.height,5);ctx.fill();
  ctx.strokeStyle='#f7fbdc';ctx.lineWidth=3;
  const ex=exit.x+exit.width/2,ey=exit.y+exit.height/2,size=Math.min(exit.width*.26,exit.height*.2);
  ctx.beginPath();ctx.moveTo(ex-size,ey);ctx.lineTo(ex+size,ey);ctx.moveTo(ex+size*.4,ey-size*.6);ctx.lineTo(ex+size,ey);ctx.lineTo(ex+size*.4,ey+size*.6);ctx.stroke();
  ctx.fillStyle='#5d7651';ctx.textAlign='center';ctx.font='bold 13px ui-monospace,monospace';ctx.fillText(exit.label,ex,exit.y-13);ctx.textAlign='left';
  const {x,y}=world.ball.position,r=level.ball.radius;
  ctx.fillStyle='#d2e98b';ctx.strokeStyle='#344b39';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f8f9d4';ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.25,0,Math.PI*2);ctx.fill();
  if(!world.started){
    ctx.fillStyle='#7e906e';ctx.font='12px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(level.initialGravity === 0 ? 'NO GRAVITY' : 'READY TO MOVE',x,y-r-15);ctx.textAlign='left';
    if(level.ball.velocity[0]){
      ctx.strokeStyle='#93a47a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+r+9,y);ctx.lineTo(x+r+48,y);ctx.lineTo(x+r+42,y-5);ctx.moveTo(x+r+48,y);ctx.lineTo(x+r+42,y+5);ctx.stroke();
    }
  }
}
