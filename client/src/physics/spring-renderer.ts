import type { PhysicsWorld } from './world';
import { physicsColours } from './visual-language';
import { sceneFonts } from './drawing-theme';

export function drawGeometrySprings(ctx: CanvasRenderingContext2D,world: PhysicsWorld) {
  for(const spring of world.level.devices || []) {
    if(spring.kind!=='spring')continue;
    const state=world.devices.springs.get(spring.id),{x,y,width}=spring.area;
    const compression=state?.phase==='charging' ? Math.min(1,state.elapsed/(spring.chargeSeconds || .6))*(spring.compressionDistance || 0) : 0;
    const top=y+compression,bottom=y+44,cx=x+width/2;
    ctx.save();ctx.strokeStyle=physicsColours.bounce;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(cx,bottom);
    for(let i=0;i<=8;i++)ctx.lineTo(cx+(i%2?10:-10),bottom-(bottom-top)*i/8);
    ctx.stroke();ctx.fillStyle=physicsColours.bounce;ctx.fillRect(x,top-3,width,6);
    ctx.fillStyle=physicsColours.structure;ctx.font=sceneFonts.small;ctx.textAlign='center';
    ctx.fillText(state?.phase==='charging' ? 'CHARGING' : 'AUTO SPRING',cx,bottom+25);ctx.restore();
  }
}
