import { sceneryLayout } from './layout';
import type { LivingFrame, WaterParticle } from './living-world';

export interface FlowPoint { readonly x:number; readonly y:number }

/** Connect equal-age water parcels into one continuous stream, keeping their existing inertia. */
export function waterfallCentreline(water:readonly WaterParticle[]):FlowPoint[] {
  const {x,y,width,poolY}=sceneryLayout.waterfall;
  const source={x:x+width/2,y};
  const ordered=[...water].sort((a,b)=>a.age-b.age);
  const points:FlowPoint[]=[source];
  for(let i=0;i<ordered.length;i+=5) {
    const group=ordered.slice(i,i+5);
    points.push({x:group.reduce((sum,drop)=>sum+drop.x-drop.lane*width+width/2,0)/group.length,
      y:group.reduce((sum,drop)=>sum+drop.y,0)/group.length});
  }
  // Ordinary downward flow meets the pool instead of ending abruptly above it.
  const downward=points.length>1&&points.every(point=>point.y>=y&&Math.abs(point.x-source.x)<60);
  if(downward) {
    const end=points.findIndex(point=>point.y>=poolY);
    if(end>=0)points.splice(end,points.length-end,{x:points[end].x,y:poolY});
    else points.push({x:points[points.length-1].x,y:poolY});
  }
  return points;
}

function smoothPath(ctx:CanvasRenderingContext2D,points:readonly FlowPoint[],offset=0) {
  ctx.beginPath();ctx.moveTo(points[0].x+offset,points[0].y);
  for(let i=1;i<points.length-1;i++) {
    const point=points[i],next=points[i+1];
    ctx.quadraticCurveTo(point.x+offset,point.y,(point.x+next.x)/2+offset,(point.y+next.y)/2);
  }
  const last=points[points.length-1];ctx.lineTo(last.x+offset,last.y);
}

export function drawWaterfall(ctx:CanvasRenderingContext2D,frame:LivingFrame) {
  const points=waterfallCentreline(frame.water);
  if(points.length<2)return;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  // Two simple, uninterrupted water ribbons. Parcels are never rendered as loose rain marks.
  ctx.strokeStyle='#a8d2c9';ctx.lineWidth=25;smoothPath(ctx,points);ctx.stroke();
  ctx.strokeStyle='#d4e9db';ctx.lineWidth=9;smoothPath(ctx,points,-6);ctx.stroke();
  ctx.strokeStyle='#79b7b5';ctx.lineWidth=7;smoothPath(ctx,points,8);ctx.stroke();
  // Only three quiet white ripples travel down the stream.
  ctx.strokeStyle='#f1faf0';ctx.lineWidth=2;
  for(let ripple=0;ripple<3;ripple++) {
    const t=((frame.time*.22+ripple/3)%1)*(points.length-2);
    const index=Math.floor(t)+1,blend=t-Math.floor(t),a=points[index],b=points[Math.min(index+1,points.length-1)];
    const x=a.x+(b.x-a.x)*blend,y=a.y+(b.y-a.y)*blend;
    ctx.beginPath();ctx.moveTo(x-6,y);ctx.quadraticCurveTo(x,y+3,x+5,y+1);ctx.stroke();
  }
  const end=points[points.length-1];
  if(Math.abs(end.y-sceneryLayout.waterfall.poolY)<2) {
    ctx.strokeStyle='#d9ede0';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(end.x,sceneryLayout.waterfall.poolY,23,4,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(end.x-14,end.y-2);ctx.quadraticCurveTo(end.x-20,end.y-10,end.x-23,end.y-4);
    ctx.moveTo(end.x+12,end.y-2);ctx.quadraticCurveTo(end.x+18,end.y-9,end.x+22,end.y-3);ctx.stroke();
  }
  ctx.restore();
}
