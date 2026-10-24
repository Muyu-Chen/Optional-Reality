import type { PhysicsWorld } from './world';
import { physicsColours } from './visual-language';

export function drawGoal(ctx: CanvasRenderingContext2D, world: PhysicsWorld) {
  const exit=world.level.exit;
  ctx.save();ctx.lineWidth=2;ctx.textAlign='center';ctx.font='13px ui-monospace,monospace';
  const cx=exit.x+exit.width/2;
  if(exit.condition) {
    ctx.fillStyle=`${physicsColours.goal}12`;ctx.fillRect(exit.x,exit.y,exit.width,exit.height);
    ctx.strokeStyle=physicsColours.goal;ctx.strokeRect(exit.x,exit.y,exit.width,exit.height);
    ctx.fillStyle=physicsColours.goal;ctx.fillText(`${exit.label} · KEEP STILL ${exit.condition.seconds}s`,cx,exit.y-14);
    if(world.goal.progress>0)ctx.fillRect(exit.x+8,exit.y+8,(exit.width-16)*world.goal.progress,4);
  } else {
    ctx.fillStyle=world.won?'#779957':'#344b39';ctx.beginPath();ctx.roundRect(exit.x,exit.y,exit.width,exit.height,5);ctx.fill();
    ctx.strokeStyle='#f7fbdc';ctx.lineWidth=3;
    const cy=exit.y+exit.height/2,size=Math.min(exit.width*.26,exit.height*.2);
    ctx.beginPath();ctx.moveTo(cx-size,cy);ctx.lineTo(cx+size,cy);ctx.moveTo(cx+size*.4,cy-size*.6);ctx.lineTo(cx+size,cy);ctx.lineTo(cx+size*.4,cy+size*.6);ctx.stroke();
    ctx.fillStyle='#5d7651';ctx.fillText(exit.label,cx,exit.y-13);
  }
  ctx.restore();
}
