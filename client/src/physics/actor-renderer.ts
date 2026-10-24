import type { PhysicsWorld } from './world';
import { drawForceArrow } from './visual-language';

export function drawActor(ctx: CanvasRenderingContext2D, world: PhysicsWorld) {
  const {level,ball}=world, {x,y}=ball.position, r=level.ball.radius;
  ctx.save();ctx.translate(x,y);ctx.rotate(ball.angle);
  ctx.fillStyle='#d2e98b';ctx.strokeStyle='#344b39';ctx.lineWidth=2.5;ctx.beginPath();
  if(level.ball.shape) {
    const {width,height}=level.ball.shape;
    ctx.rect(-width/2,-height/2,width,height);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f8f9d4';ctx.fillRect(-width/2+6,-height/2+6,width-12,4);
  } else {
    ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f8f9d4';ctx.beginPath();ctx.arc(-r*.3,-r*.3,r*.25,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  if(!world.started) {
    ctx.save();ctx.fillStyle='#7e906e';ctx.font='12px ui-monospace,monospace';ctx.textAlign='center';
    ctx.fillText(level.initialGravity===0?'NO GRAVITY':'READY TO MOVE',x,y-r-15);
    if(level.ball.velocity[0])drawForceArrow(ctx,x+r+9,y,[level.ball.velocity[0],0],39,'#93a47a');
    ctx.restore();
  }
}
