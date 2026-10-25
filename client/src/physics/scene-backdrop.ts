import { sceneColours } from './drawing-theme';
import type { AmbientFrame } from './ambient-scenery';
import { drawAmbientScenery } from './ambient-scenery-renderer';

// Distant illustration only: none of these soft shapes represent solid geometry.
export function drawPuzzleBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number, ambient?:AmbientFrame,reducedMotion=false) {
  ctx.save();
  const light=ctx.createRadialGradient(width*.28,height*.24,0,width*.28,height*.24,width*.7);
  light.addColorStop(0,'#fff5ce80');light.addColorStop(1,'#fff5ce00');
  ctx.fillStyle=light;ctx.fillRect(0,0,width,height);
  if(ambient)drawAmbientScenery(ctx,ambient,reducedMotion);
  else for(const [x,y,r] of [[width*.15,height*.12,25],[width*.68,height*.16,34],[width*.86,height*.32,18]]) {
    ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.ellipse(x,y,r*1.8,r*.55,0,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#71977a0b';ctx.beginPath();ctx.moveTo(0,height);
  ctx.bezierCurveTo(width*.1,height*.75,width*.22,height*.95,width*.42,height*.9);
  ctx.bezierCurveTo(width*.65,height*.78,width*.8,height*.8,width,height*.94);
  ctx.lineTo(width,height);ctx.closePath();ctx.fill();
  ctx.strokeStyle=sceneColours.guide;ctx.globalAlpha=.2;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(width*.03,height-5);ctx.lineTo(width*.97,height-5);ctx.stroke();
  ctx.restore();
}
