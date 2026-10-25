import type { PhysicsWorld } from './world';
import { sceneColours } from './drawing-theme';

// Star positions and collected IDs come from the same simulation module as scoring.
export function drawStars(ctx: CanvasRenderingContext2D,world: PhysicsWorld,time=0,reducedMotion=false) {
  ctx.save();
  for(const star of world.level.stars || []) {
    if(world.stars.collected.has(star.id))continue;
    const [x,y]=star.position,r=(star.radius ?? 10)*(reducedMotion?1:1+.045*Math.sin(time*2.4+x*.02));
    const glow=ctx.createRadialGradient(x,y,0,x,y,r*2);
    glow.addColorStop(0,'#ffc64436');glow.addColorStop(1,'#ffc64400');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*2,0,Math.PI*2);ctx.fill();
    const paint=ctx.createLinearGradient(x-r,y-r,x+r,y+r);
    paint.addColorStop(0,'#fff3ad');paint.addColorStop(.4,sceneColours.star);paint.addColorStop(1,'#e4a62b');
    ctx.fillStyle=paint;ctx.strokeStyle=sceneColours.starOutline;ctx.lineWidth=1.75;
    ctx.beginPath();
    for(let i=0;i<10;i++) {
      const angle=-Math.PI/2+i*Math.PI/5,size=i%2?r*.46:r;
      const px=x+Math.cos(angle)*size,py=y+Math.sin(angle)*size;
      if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#fff9d7';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-r*.42,y-r*.13);ctx.lineTo(x-r*.15,y-r*.23);ctx.lineTo(x,y-r*.6);ctx.stroke();
  }
  ctx.restore();
}
