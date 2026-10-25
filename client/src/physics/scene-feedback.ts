import type { PhysicsWorld } from './world';
import { physicsColours } from './visual-language';
import { sceneColours } from './drawing-theme';
import { ImpactFeedback } from './impact-feedback';
import { drawImpacts } from './impact-renderer';
import { actorImpactPose } from './actor-impact-pose';
import type { ImpactPulse } from './impact-state';

export interface VisualCue { kind:'star'|'release'; x:number; y:number; born:number; colour:string }

// Observes actual contacts and pickups; never changes a body, a rule or the simulation clock.
export class SceneFeedback {
  private cues: VisualCue[]=[];
  private seen=new Set<string>();
  private springs=new Map<string,string>();
  private time=0;
  private reduced=false;
  private impacts: ImpactFeedback;
  private disposed=false;
  constructor(private world: PhysicsWorld) {
    this.seen=new Set(world.stars.collected);
    this.impacts=new ImpactFeedback(world);
  }
  get active(): readonly (VisualCue | ImpactPulse)[] { return [...this.cues,...this.impacts.state.active]; }
  get actorPose() { return actorImpactPose(this.impacts.state.active,this.impacts.state.time,this.reduced); }
  advance(time:number,reduced=false) {
    if(this.disposed)return;
    this.time=time;this.reduced=reduced;
    this.cues=reduced?[]:this.cues.filter(cue=>time-cue.born<(cue.kind==='star'?.65:.36));
    this.impacts.advance(reduced);
  }
  capture() {
    if(this.disposed)return;
    this.impacts.advance(this.reduced);
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
  draw(ctx:CanvasRenderingContext2D) {
    drawImpacts(ctx,this.impacts.state.active,this.impacts.state.time);
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
  dispose() { if(this.disposed)return;this.disposed=true;this.impacts.dispose();this.cues=[];this.seen.clear();this.springs.clear(); }
}
