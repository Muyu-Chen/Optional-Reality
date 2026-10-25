import Matter from 'matter-js';
import type { PhysicsWorld } from './world';
import { physicsColours } from './visual-language';
import { sceneColours } from './drawing-theme';

export interface VisualCue { kind:'star'|'impact'|'release'; x:number; y:number; born:number; colour:string }

// Observes actual contacts and pickups; never changes a body, a rule or the simulation clock.
export class SceneFeedback {
  private cues: VisualCue[]=[];
  private seen=new Set<string>();
  private springs=new Map<string,string>();
  private time=0;
  private reduced=false;
  private lastImpact=-1;
  constructor(private world: PhysicsWorld) {
    this.seen=new Set(world.stars.collected);
    Matter.Events.on(world.engine,'collisionStart',this.onCollision);
  }
  get active(): readonly VisualCue[] { return this.cues; }
  advance(time:number,reduced=false) {
    this.time=time;this.reduced=reduced;
    this.cues=reduced?[]:this.cues.filter(cue=>time-cue.born<(cue.kind==='star'?.65:.36));
  }
  capture() {
    for(const star of this.world.level.stars || [])if(this.world.stars.collected.has(star.id)&&!this.seen.has(star.id)) {
      this.seen.add(star.id);this.add('star',...star.position,sceneColours.star);
    }
    for(const device of this.world.level.devices || [])if(device.kind==='spring') {
      const phase=this.world.devices.springs.get(device.id)?.phase;
      if(phase==='launched'&&this.springs.get(device.id)==='charging')this.add('release',device.area.x+device.area.width/2,device.area.y,physicsColours.bounce);
      if(phase)this.springs.set(device.id,phase);
    }
  }
  private add(kind:VisualCue['kind'],x:number,y:number,colour:string) {
    if(this.reduced)return;
    this.cues.push({kind,x,y,born:this.time,colour});
    if(this.cues.length>24)this.cues.shift();
  }
  private onCollision=(event:Matter.IEventCollision<Matter.Engine>)=>{
    if(this.time-this.lastImpact<.12||!this.world.running)return;
    const {ball,level}=this.world;
    if(Math.hypot(ball.velocity.x,ball.velocity.y)<.8)return;
    const pair=event.pairs.find(pair=>pair.bodyA===ball||pair.bodyB===ball);
    if(!pair)return;
    const other=pair.bodyA===ball?pair.bodyB:pair.bodyA;
    const track=level.tracks.find(track=>track.id===other.label);
    const point=pair.collision.supports[0] || ball.position;
    this.lastImpact=this.time;
    this.add('impact',point.x,point.y,track?.feature?physicsColours[track.feature]:physicsColours.structure);
  };
  draw(ctx:CanvasRenderingContext2D) {
    if(!this.cues.length)return;
    ctx.save();
    for(const cue of this.cues) {
      const duration=cue.kind==='star'?.65:.36,p=Math.min(1,(this.time-cue.born)/duration);
      ctx.globalAlpha=(1-p)**2;ctx.strokeStyle=cue.colour;ctx.fillStyle=cue.colour;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(cue.x,cue.y,8+p*(cue.kind==='star'?25:22),cue.kind==='star'?8+p*25:3+p*8,0,0,Math.PI*2);ctx.stroke();
      if(cue.kind==='star')for(let i=0;i<6;i++) {
        const a=i*Math.PI/3-.3,d=11+p*27,x=cue.x+Math.cos(a)*d,y=cue.y+Math.sin(a)*d-12*p;
        ctx.beginPath();ctx.arc(x,y,Math.max(.5,2.7*(1-p)),0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  }
  dispose() { Matter.Events.off(this.world.engine,'collisionStart',this.onCollision);this.cues=[]; }
}
