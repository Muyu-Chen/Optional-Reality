import type { AmbientFrame } from './ambient-scenery';
import { drawAmbientScenery } from './ambient-scenery-renderer';
import { drawCosmosLandscape } from './scenery/cosmos-renderer';
import { drawValleyLandscape } from './scenery/landscape-renderer';
import { drawResidents } from './scenery/resident-renderer';
import type { LivingFrame } from './scenery/living-world';
import { sceneryProfiles, type SceneryProfile } from './scenery/profiles';

/** Full-viewport illustration. Nothing in this layer represents an editable or solid object. */
export function drawPuzzleBackdrop(ctx:CanvasRenderingContext2D,width:number,height:number,frame:LivingFrame,
  ambient?:AmbientFrame,reducedMotion=false,profile:SceneryProfile=frame.theme==='cosmos'?sceneryProfiles['gravity-lab']:sceneryProfiles.bounce) {
  if(width<=0||height<=0)return;
  ctx.save();ctx.scale(width/1000,height/700);
  ctx.beginPath();ctx.rect(0,0,1000,700);ctx.clip();
  if(frame.theme==='cosmos')drawCosmosLandscape(ctx,profile);
  else {
    drawValleyLandscape(ctx,frame,profile);
    if(ambient)drawAmbientScenery(ctx,ambient,reducedMotion,{x:0,y:0,width:1000,height:700,detailScale:1.2});
  }
  drawResidents(ctx,frame,reducedMotion);
  // Warm negative space behind the HUD/footer preserves readable dark game typography.
  const top=ctx.createLinearGradient(0,0,0,230);
  top.addColorStop(0,'#f5f1e7f2');top.addColorStop(.55,'#f5f1e7bd');top.addColorStop(1,'#f5f1e700');
  ctx.fillStyle=top;ctx.fillRect(0,0,1000,230);
  const bottom=ctx.createLinearGradient(0,630,0,700);
  bottom.addColorStop(0,'#f5f1e700');bottom.addColorStop(1,'#f5f1e7e8');
  ctx.fillStyle=bottom;ctx.fillRect(0,630,1000,70);
  ctx.restore();
}
