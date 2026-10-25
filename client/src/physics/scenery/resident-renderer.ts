import type { LivingFrame, SceneryResident } from './living-world';

function person(ctx:CanvasRenderingContext2D,actor:SceneryResident,time:number,space:boolean) {
  const stride=actor.grounded?Math.sin(actor.phase)*4:Math.sin(actor.phase)*2;
  const bob=actor.grounded?Math.abs(Math.sin(actor.phase))*1.2:0;
  ctx.translate(0,-bob);
  ctx.strokeStyle=space?'#7d87a3':'#697a73';ctx.lineWidth=2.8;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-4-stride,0);ctx.moveTo(0,-11);ctx.lineTo(4+stride,0);ctx.stroke();
  ctx.strokeStyle=space?'#f2eee1':actor.palette?'#9c8caa':'#d5ad7d';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(0,-21);ctx.lineTo(0,-11);ctx.stroke();ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(-5+stride,-11);ctx.moveTo(0,-19);ctx.lineTo(5-stride,-11);ctx.stroke();
  ctx.fillStyle=space?'#f7f1df':'#d7bda0';ctx.beginPath();ctx.arc(0,-27,space?5.8:4.2,0,Math.PI*2);ctx.fill();
  if(space){ctx.fillStyle='#7f9fae';ctx.beginPath();ctx.ellipse(1,-27,3.8,2.5,-.15,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c5b9bf';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,-17);ctx.bezierCurveTo(-13,-12,-15-Math.sin(time)*2,-28,-21,-16);ctx.stroke();}
}

function car(ctx:CanvasRenderingContext2D,actor:SceneryResident,space:boolean) {
  const direction=actor.vx>=0?1:-1;ctx.scale(direction,1);
  if(space) {
    ctx.fillStyle='#8199b3';ctx.fillRect(-25,-14,14,9);ctx.fillRect(12,-14,14,9);
    ctx.strokeStyle='#dce4e7';ctx.lineWidth=.8;for(const x of [-20,-15,17,22]){ctx.beginPath();ctx.moveTo(x,-14);ctx.lineTo(x,-5);ctx.stroke();}
    ctx.fillStyle='#e3d8bb';ctx.beginPath();ctx.ellipse(0,-10,10,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#85a4ac';ctx.beginPath();ctx.arc(3,-11,4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#a29ba8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(-3,-26);ctx.stroke();
    ctx.fillStyle='#ddbb91';ctx.beginPath();ctx.arc(-3,-26,2,0,Math.PI*2);ctx.fill();return;
  }
  ctx.fillStyle=actor.palette?'#c6a08b':'#8ba7a3';ctx.beginPath();ctx.roundRect(-19,-15,38,11,4);ctx.fill();
  ctx.beginPath();ctx.moveTo(-11,-15);ctx.lineTo(-6,-23);ctx.lineTo(7,-23);ctx.lineTo(13,-15);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e2e5d3';ctx.beginPath();ctx.moveTo(-7,-16);ctx.lineTo(-4,-21);ctx.lineTo(5,-21);ctx.lineTo(8,-16);ctx.closePath();ctx.fill();
  for(const x of [-11,11]){ctx.fillStyle='#65726a';ctx.beginPath();ctx.arc(x,-3,4.2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c7c9b8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,-3);ctx.lineTo(x+Math.cos(actor.phase)*2,-3+Math.sin(actor.phase)*2);ctx.stroke();}
  ctx.fillStyle='#f7e7b6';ctx.fillRect(15,-12,3,3);
}

export function drawResidents(ctx:CanvasRenderingContext2D,frame:LivingFrame,reducedMotion:boolean) {
  ctx.save();ctx.globalAlpha=.85;
  for(const actor of frame.residents) {
    ctx.save();ctx.translate(actor.x,actor.y);ctx.rotate(actor.angle);
    const staticActor=reducedMotion?{...actor,phase:0}:actor;
    if(actor.kind==='walker')person(ctx,staticActor,reducedMotion?0:frame.time,frame.theme==='cosmos');
    else car(ctx,staticActor,frame.theme==='cosmos');ctx.restore();
  }
  ctx.restore();
}
