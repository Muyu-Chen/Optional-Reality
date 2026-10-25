import type { PhysicsWorld } from './world';
import type { LevelDefinition } from '../levels/types';
import { sceneColours } from './drawing-theme';

export function drawActor(ctx: CanvasRenderingContext2D, world: PhysicsWorld) {
  if (world.won) return;
  drawActorAt(ctx, world.level, world.ball.position, world.ball.angle);
}

export function drawActorAt(ctx: CanvasRenderingContext2D, level: LevelDefinition, position: {x:number;y:number}, angle = 0) {
  const {x,y}=position, r=level.ball.radius;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  const paint=ctx.createRadialGradient(-r*.35,-r*.4,r*.08,0,0,r*1.2);
  paint.addColorStop(0,'#f2ffa5');paint.addColorStop(.5,sceneColours.actor);paint.addColorStop(1,'#77aa37');
  ctx.fillStyle=paint;ctx.strokeStyle=sceneColours.actorOutline;ctx.lineWidth=2.5;ctx.beginPath();
  ctx.shadowColor='#24432926';ctx.shadowBlur=5;ctx.shadowOffsetY=3;
  if(level.ball.shape) {
    const {width,height}=level.ball.shape;
    ctx.roundRect(-width/2,-height/2,width,height,4);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.fillStyle=sceneColours.actorHighlight;ctx.fillRect(-width/2+6,-height/2+6,width-12,4);
  } else {
    ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle='#efffa988';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r-4,-Math.PI*.93,-Math.PI*.3);ctx.stroke();
    ctx.fillStyle=sceneColours.actorHighlight;ctx.beginPath();ctx.arc(-r*.3,-r*.3,r*.25,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
