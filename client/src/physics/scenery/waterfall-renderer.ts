import { sceneryLayout } from './layout';
import type { LivingFrame, WaterParticle } from './living-world';

export interface FlowPoint { readonly x:number; readonly y:number }

/** Connect equal-age water parcels into one continuous stream, keeping their existing inertia. */
export function waterfallCentreline(water:readonly WaterParticle[]):FlowPoint[] {
  if(water.length===0)return [];
  const {x,y,width,poolY}=sceneryLayout.waterfall;
  const source={x:x+width/2,y};
  const ordered=[...water].sort((a,b)=>a.age-b.age);
  const points:FlowPoint[]=[source];
  const stride=Math.max(1,Math.ceil(ordered.length/12));
  for(let i=0;i<ordered.length;i+=stride) {
    const group=ordered.slice(i,i+stride);
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
  // The faint base keeps the dense stream legible while individual fine particles carry its motion.
  // A connecting ribbon is safe only while parcels form an ordinary waterfall.
  // During a gravity change, old and newly emitted parcels can cross; joining
  // them by age would invent a large looping hose unrelated to the particles.
  const {x,y,width,poolY}=sceneryLayout.waterfall;
  const ordinaryFlow=frame.water.every(drop=>drop.vy>=0&&drop.y>=y&&drop.y<=poolY&&
    Math.abs(drop.x-(x+drop.lane*width))<3);
  if(ordinaryFlow) {
    ctx.globalAlpha=.22;ctx.strokeStyle='#a8d2c9';ctx.lineWidth=27;smoothPath(ctx,points);ctx.stroke();
  }
  const colours=['#e9f7ee','#90c8c2','#68aaa9'];
  for(let group=0;group<colours.length;group++) {
    ctx.globalAlpha=group===0?.9:.68;ctx.fillStyle=colours[group];ctx.beginPath();
    for(let i=group;i<frame.water.length;i+=colours.length) {
      const drop=frame.water[i];ctx.moveTo(drop.x+drop.radius,drop.y);
      ctx.arc(drop.x,drop.y,drop.radius,0,Math.PI*2);
    }
    ctx.fill();
  }
  for(const particle of frame.spray) {
    ctx.globalAlpha=(1-particle.age/particle.life)*.75;ctx.fillStyle='#e5f6eb';
    ctx.beginPath();ctx.arc(particle.x,particle.y,particle.radius,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=.8;
  const end=points[points.length-1];
  if(Math.abs(end.y-sceneryLayout.waterfall.poolY)<2) {
    ctx.strokeStyle='#d9ede0';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(end.x,sceneryLayout.waterfall.poolY,23,4,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
