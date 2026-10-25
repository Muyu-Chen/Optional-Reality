import type { PhysicsWorld } from './world';
import { physicsColours } from './visual-language';
import { sceneFonts } from './drawing-theme';

export function drawGeometrySprings(ctx: CanvasRenderingContext2D,world: PhysicsWorld) {
  for(const spring of world.level.devices || []) {
    if(spring.kind!=='spring')continue;
    const state=world.devices.springs.get(spring.id),{x,y,width}=spring.area;
    const compression=state?.phase==='charging' ? Math.min(1,state.elapsed/(spring.chargeSeconds || .6))*(spring.compressionDistance || 0) : 0;
    const top=spring.response==='elastic'?(state?.top ?? y):y+compression,bottom=y+44,cx=x+width/2;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    ctx.fillStyle='#2547301a';ctx.beginPath();ctx.ellipse(cx,bottom+4,width*.48,5,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=physicsColours.bounce;ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(cx,bottom);
    const step=(bottom-top)/8;
    for(let i=0;i<8;i++)ctx.quadraticCurveTo(cx+(i%2?17:-17),bottom-step*(i+.5),cx,bottom-step*(i+1));
    ctx.stroke();ctx.fillStyle=physicsColours.bounce;
    ctx.beginPath();ctx.roundRect(x,top-4,width,8,4);ctx.fill();
    ctx.fillStyle='#b3daf8';ctx.beginPath();ctx.roundRect(x+3,top-3,width-6,2,1);ctx.fill();
    ctx.fillStyle=physicsColours.structure;ctx.font=sceneFonts.small;ctx.textAlign='center';
    const label=spring.response==='elastic' ? state?.phase==='charging' ? world.ball.velocity.y>0?'Compressing':'Rebounding' : 'Spring'
      : state?.phase==='charging'?'Storing energy':'Powered launcher';
    ctx.fillText(label,cx,bottom+25);ctx.restore();
  }
}
