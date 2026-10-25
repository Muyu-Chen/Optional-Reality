import type { AmbientBird, AmbientFrame } from './ambient-scenery';

export interface AmbientView { x:number; y:number; width:number; height:number; detailScale?:number }

function drawBird(ctx:CanvasRenderingContext2D,bird:AmbientBird,x:number,y:number,scale:number,reducedMotion:boolean) {
  const eagle=bird.kind==='eagle',span=(eagle?8:4.2)*scale;
  const flap=reducedMotion?0:eagle?Math.max(0,Math.cos(bird.wingPhase))**12*.35:Math.sin(bird.wingPhase)*.65;
  ctx.save();ctx.translate(x,y);
  // Lift turns continuously in the state model, including upside-down flight.
  const bank=bird.liftAngle+Math.PI/2+Math.sin(bird.heading)*.12;
  ctx.rotate(bank);
  ctx.strokeStyle=eagle?'#53645c66':'#62827666';ctx.lineWidth=(eagle?1.3:1.1)*scale;
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(-span,-span*(.18+flap));
  ctx.quadraticCurveTo(-span*.55,-span*(.38+flap*.8),0,span*.16);
  ctx.quadraticCurveTo(span*.55,-span*(.38+flap*.8),span,-span*(.18+flap));ctx.stroke();
  if(eagle) {
    ctx.beginPath();ctx.moveTo(0,-span*.1);ctx.lineTo(0,span*.4);
    ctx.moveTo(-span*.17,span*.52);ctx.lineTo(0,span*.4);ctx.lineTo(span*.17,span*.52);ctx.stroke();
  }
  ctx.restore();
}

// Low contrast distant silhouettes are always painted below gameplay objects.
export function drawAmbientScenery(ctx:CanvasRenderingContext2D,frame:AmbientFrame,reducedMotion=false,view?:AmbientView) {
  const area=view||{x:0,y:0,width:frame.width,height:frame.height};
  const scale=view?.detailScale??1;
  const project=(x:number,y:number):[number,number]=>[area.x+x/frame.width*area.width,area.y+y/frame.height*area.height];
  ctx.save();ctx.beginPath();ctx.rect(area.x,area.y,area.width,area.height);ctx.clip();
  for(const cloud of frame.clouds) {
    const [x,y]=project(cloud.x,cloud.y),r=cloud.radius*scale;
    ctx.fillStyle='#ffffff6b';ctx.beginPath();
    ctx.ellipse(x,y,r*1.65,r*.36,0,0,Math.PI*2);
    ctx.ellipse(x-r*.42,y-r*.17,r*.7,r*.42,0,0,Math.PI*2);
    ctx.ellipse(x+r*.32,y-r*.26,r*.8,r*.5,0,0,Math.PI*2);ctx.fill();
  }
  for(const bird of frame.birds) {
    const [x,y]=project(bird.x,bird.y);
    drawBird(ctx,bird,x,y,scale,reducedMotion);
  }
  ctx.restore();
}
