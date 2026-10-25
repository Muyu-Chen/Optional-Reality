import type Matter from 'matter-js';
import type { LevelDefinition, Point } from '../levels/types';

const distanceToSegment = (point: Point, from: Point, to: Point) => {
  const dx=to[0]-from[0],dy=to[1]-from[1],length=dx*dx+dy*dy;
  const t=length ? Math.max(0,Math.min(1,((point[0]-from[0])*dx+(point[1]-from[1])*dy)/length)) : 0;
  return Math.hypot(point[0]-from[0]-dx*t,point[1]-from[1]-dy*t);
};
function crossesRect(from: Point,to: Point,left: number,top: number,right: number,bottom: number) {
  let enter=0,leave=1;
  for (const [origin,delta,min,max] of [[from[0],to[0]-from[0],left,right],[from[1],to[1]-from[1],top,bottom]]) {
    if (!delta) { if(origin<min || origin>max)return false;continue; }
    const a=(min-origin)/delta,b=(max-origin)/delta;
    enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
    if(enter>leave)return false;
  }
  return true;
}

// Swept contact prevents fast motion from skipping a star between fixed steps.
export function touchesStar(level: LevelDefinition,star: Point,radius: number,from: Point,to: Point) {
  const shape=level.ball.shape;
  if (!shape) return distanceToSegment(star,from,to)<=radius+level.ball.radius;
  const hw=shape.width/2,hh=shape.height/2,[x,y]=star;
  const corners: Point[]=[[x-hw,y-hh],[x+hw,y-hh],[x-hw,y+hh],[x+hw,y+hh]];
  return crossesRect(from,to,x-hw-radius,y-hh,x+hw+radius,y+hh)
    || crossesRect(from,to,x-hw,y-hh-radius,x+hw,y+hh+radius)
    || corners.some(corner=>distanceToSegment(corner,from,to)<=radius);
}

export class StarCollection {
  readonly collected = new Set<string>();
  constructor(readonly level: LevelDefinition) {
    const stars=level.stars || [];
    if (level.stars && stars.length<3) throw new Error('A scored level needs at least three stars.');
    if(new Set(stars.map(star=>star.id)).size!==stars.length)throw new Error('Star IDs must be unique.');
    for(const star of stars) {
      const [x,y]=star.position,r=star.radius ?? 10;
      if(!star.id || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(r) || r<=0 || r>30
        || x<0 || y<0 || x>level.viewport.width || y>level.viewport.height)throw new Error('Invalid star configuration.');
    }
  }
  get total() { return this.level.stars?.length || 0; }
  get fullScore() { return this.total>0 && this.collected.size===this.total; }
  update(actor: Matter.Body,from: Point) {
    const to: Point=[actor.position.x,actor.position.y];
    for(const star of this.level.stars || []) if(!this.collected.has(star.id)
      && touchesStar(this.level,star.position,star.radius ?? 10,from,to))this.collected.add(star.id);
  }
  snapshot() { return {collected:this.collected.size,total:this.total}; }
}
