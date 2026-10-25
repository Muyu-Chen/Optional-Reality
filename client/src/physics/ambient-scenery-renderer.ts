import type { AmbientFrame } from './ambient-scenery';
import { drawAmbientBird } from './ambient-bird-renderer';

export interface AmbientView { x:number; y:number; width:number; height:number; detailScale?:number }

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
    drawAmbientBird(ctx,bird,x,y,scale,reducedMotion);
  }
  ctx.restore();
}
