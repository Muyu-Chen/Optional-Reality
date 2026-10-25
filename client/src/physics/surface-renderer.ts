import type { RuleState } from '../../../shared/rules';
import type { TrackDefinition } from '../levels/types';
import { drawBounceMarks, physicsColours } from './visual-language';
import { sceneFonts } from './drawing-theme';

function drawFrictionMarks(ctx: CanvasRenderingContext2D, track: TrackDefinition, friction: number) {
  const amount = Math.sqrt(Math.max(0,Math.min(1,friction)));
  // Stationary grains sit inside the actual surface, rather than reading as belt treads.
  ctx.save();ctx.strokeStyle='#def7e8';ctx.lineWidth=1.5;ctx.globalAlpha=.3+.4*amount;
  for(let i=1;i<track.points.length;i++) {
    const [x,y]=track.points[i-1], [ex,ey]=track.points[i];
    const length=Math.hypot(ex-x,ey-y);
    if(length<1)continue;
    const dx=(ex-x)/length,dy=(ey-y)/length,grain=track.thickness*(.04+.22*amount);
    for(let d=9;d<length-8;d+=23-13*amount) {
      const px=x+dx*d,py=y+dy*d;
      ctx.beginPath();ctx.moveTo(px-dx*1.5+dy*grain,py-dy*1.5-dx*grain);
      ctx.lineTo(px+dx*1.5-dy*grain,py+dy*1.5+dx*grain);ctx.stroke();
    }
  }
  ctx.restore();
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
    const label = track.label || (track.feature==='bounce'?'Bouncy surface':'Grip surface');
    const local = rules.values[track.id]?.[property] !== undefined;
    ctx.fillText(local ? `${label} · ${Number(value.toFixed(3))}` : label,track.points[0][0]+10,track.points[0][1]+track.thickness/2+32);
  }
  ctx.restore();
}
