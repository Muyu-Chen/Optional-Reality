import type { RuleState } from '../../../shared/rules';
import type { TrackDefinition } from '../levels/types';
import { drawBounceMarks, physicsColours } from './visual-language';
import { sceneFonts } from './drawing-theme';

function drawFrictionMarks(ctx: CanvasRenderingContext2D, track: TrackDefinition, friction: number) {
  const amount = Math.sqrt(Math.max(0,Math.min(1,friction)));
  ctx.strokeStyle=physicsColours.friction;ctx.lineWidth=1.5;
  for(let i=1;i<track.points.length;i++) {
    const [x,y]=track.points[i-1], [ex,ey]=track.points[i];
    const length=Math.hypot(ex-x,ey-y), dx=(ex-x)/length, dy=(ey-y)/length;
    const offset=track.thickness/2+3;
    ctx.beginPath();ctx.moveTo(x+dy*offset,y-dx*offset);ctx.lineTo(ex+dy*offset,ey-dx*offset);ctx.stroke();
    if(friction<=0)continue;
    for(let d=8;d<length-8;d+=24-16*amount) {
      const px=x+dx*d+dy*offset,py=y+dy*d-dx*offset;
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+dx*4+dy*(2+6*amount),py+dy*4-dx*(2+6*amount));ctx.stroke();
    }
  }
}

export function drawSurface(ctx: CanvasRenderingContext2D, track: TrackDefinition, rules: RuleState) {
  ctx.save();ctx.lineWidth=track.thickness;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.shadowColor='#233d3030';ctx.shadowBlur=4;ctx.shadowOffsetY=3;
  ctx.strokeStyle=track.feature ? physicsColours[track.feature] : physicsColours.structure;
  ctx.beginPath();track.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.save();ctx.translate(0,-track.thickness*.18);ctx.lineWidth=Math.max(1,track.thickness*.22);ctx.strokeStyle='#ffffff65';
  ctx.beginPath();track.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();
  if(track.feature) {
    const property=track.feature==='bounce'?'restitution':'friction';
    const value=rules.values[track.id]?.[property] ?? rules.values.world?.[property] ?? 0;
    if(track.feature==='bounce')drawBounceMarks(ctx,track.points,value);else drawFrictionMarks(ctx,track,value);
    ctx.font=sceneFonts.label;ctx.fillStyle=physicsColours[track.feature];
    ctx.fillText(track.label || (track.feature==='bounce'?'Bouncy surface':'Grip surface'),track.points[0][0]+10,track.points[0][1]+track.thickness/2+32);
  }
  ctx.restore();
}
