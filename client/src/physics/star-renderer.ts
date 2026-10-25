import type { PhysicsWorld } from './world';

// Star positions and collected IDs come from the same simulation module as scoring.
export function drawStars(ctx: CanvasRenderingContext2D,world: PhysicsWorld) {
  ctx.save();
  for(const star of world.level.stars || []) {
    if(world.stars.collected.has(star.id))continue;
    const [x,y]=star.position,r=star.radius ?? 10;
    ctx.fillStyle='#f4d569';ctx.strokeStyle='#94782d';ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<10;i++) {
      const angle=-Math.PI/2+i*Math.PI/5,size=i%2?r*.46:r;
      const px=x+Math.cos(angle)*size,py=y+Math.sin(angle)*size;
      if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
}
