import type { PhysicsWorld } from './world';
import { physicsColours } from './visual-language';
import { sceneColours, sceneFonts } from './drawing-theme';

export function drawGoal(ctx: CanvasRenderingContext2D, world: PhysicsWorld) {
  if (world.won) return;
  const exit=world.level.exit;
  ctx.save();ctx.lineWidth=2;ctx.textAlign='center';ctx.font=sceneFonts.label;
  const cx=exit.x+exit.width/2;
  if(exit.condition) {
    ctx.fillStyle=`${physicsColours.goal}18`;ctx.fillRect(exit.x,exit.y,exit.width,exit.height);
    ctx.strokeStyle=physicsColours.goal;ctx.strokeRect(exit.x,exit.y,exit.width,exit.height);
    ctx.fillStyle=physicsColours.goal;ctx.fillText(exit.label,cx,exit.y-14);
    if(world.goal.progress>0)ctx.fillRect(exit.x+8,exit.y+8,(exit.width-16)*world.goal.progress,4);
  } else {
    const paint=ctx.createLinearGradient(exit.x,exit.y,exit.x+exit.width,exit.y+exit.height);
    paint.addColorStop(0,world.won?'#3d9c6c':'#397258');paint.addColorStop(1,sceneColours.ink);
    ctx.shadowColor='#2b553533';ctx.shadowBlur=14;
    ctx.fillStyle=paint;ctx.beginPath();ctx.roundRect(exit.x,exit.y,exit.width,exit.height,[exit.width*.45,exit.width*.45,6,6]);ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#f8df9477';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#8fc99c';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(exit.x+5,exit.y+5,exit.width-10,exit.height-10,[exit.width*.35,exit.width*.35,3,3]);ctx.stroke();
    ctx.strokeStyle=sceneColours.goalArrow;ctx.lineWidth=3;
    const cy=exit.y+exit.height/2,size=Math.min(exit.width*.26,exit.height*.2);
    ctx.beginPath();ctx.moveTo(cx-size,cy);ctx.lineTo(cx+size,cy);ctx.moveTo(cx+size*.4,cy-size*.6);ctx.lineTo(cx+size,cy);ctx.lineTo(cx+size*.4,cy+size*.6);ctx.stroke();
    ctx.fillStyle=physicsColours.goal;ctx.fillText(exit.label,cx,exit.y-13);
  }
  ctx.restore();
}
