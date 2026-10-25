import type { PhysicsWorld } from './world';
import { drawForceArrow } from './visual-language';
import { sceneColours, sceneFonts } from './drawing-theme';

export function drawActor(ctx: CanvasRenderingContext2D, world: PhysicsWorld) {
  const {level,ball}=world, {x,y}=ball.position, r=level.ball.radius;
  ctx.save();ctx.translate(x,y);ctx.rotate(ball.angle);
  ctx.fillStyle=sceneColours.actor;ctx.strokeStyle=sceneColours.actorOutline;ctx.lineWidth=2.5;ctx.beginPath();
  if(level.ball.shape) {
    const {width,height}=level.ball.shape;
    ctx.rect(-width/2,-height/2,width,height);ctx.fill();ctx.stroke();
    ctx.fillStyle=sceneColours.actorHighlight;ctx.fillRect(-width/2+6,-height/2+6,width-12,4);
  } else {
    ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=sceneColours.actorHighlight;ctx.beginPath();ctx.arc(-r*.3,-r*.3,r*.25,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  if(!world.started) {
    ctx.save();ctx.fillStyle=sceneColours.muted;ctx.font=sceneFonts.small;ctx.textAlign='center';
    ctx.fillText(!world.rules.acceleration.x&&!world.rules.acceleration.y?'NO ACCELERATION':'READY TO MOVE',x,y-r-15);
    if(level.ball.velocity[0])drawForceArrow(ctx,x+r+9,y,[level.ball.velocity[0],0],39,sceneColours.muted);
    ctx.restore();
  }
}
