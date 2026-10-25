import type { AccelerationVector } from '../../../shared/acceleration';

export interface AmbientBird {
  readonly id: string;
  readonly kind: 'bird' | 'eagle';
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly heading: number;
  readonly liftAngle: number;
  readonly wingPhase: number;
}
export interface AmbientCloud {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly vx: number;
  readonly vy: number;
}
export interface AmbientFrame {
  readonly width: number;
  readonly height: number;
  readonly time: number;
  readonly birds: readonly AmbientBird[];
  readonly clouds: readonly AmbientCloud[];
}
interface FlightState {
  id: string;
  kind: AmbientBird['kind'];
  x: number; y: number; vx: number; vy: number;
  heading: number; liftAngle: number; wingPhase: number;
  anchorX: number; anchorY: number; phase: number; speed: number;
}
interface CloudState { x: number; y: number; radius: number; vx: number; vy: number; phase: number }

const STEP=1/120;
const approach=(value:number,target:number,rate:number,dt:number)=>value+(target-value)*(1-Math.exp(-rate*dt));
const angleDifference=(from:number,to:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

// A tiny deterministic background ecosystem. It never creates a Matter body or a timer.
export class AmbientScenery {
  private time=0;
  private remainder=0;
  private disposed=false;
  private birds: FlightState[];
  private clouds: CloudState[];

  constructor(readonly width:number,readonly height:number) {
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Ambient scenery needs a positive viewport.');
    const placements=[
      [.20,.19,0], [.22,.215,.19], [.24,.19,.39],
      [.56,.27,1.8], [.59,.25,2.02], [.76,.16,0],
    ];
    this.birds=placements.map(([x,y,phase],i)=>{
      const kind=i===placements.length-1?'eagle':'bird';
      const radius=kind==='eagle'?width*.085:width*.07;
      return {id:`ambient-${i}`,kind,x:x*width+Math.cos(phase)*radius,y:y*height-Math.sin(phase)*height*.045,
        vx:0,vy:0,heading:0,liftAngle:-Math.PI/2,wingPhase:i*.8,anchorX:x*width,anchorY:y*height,phase,speed:kind==='eagle'?.29:.14};
    });
    this.clouds=[[.12,.09,19],[.48,.13,25],[.83,.07,17]].map(([x,y,radius],i)=>({
      x:x*width,y:y*height,radius,vx:1.2+i*.25,vy:0,phase:i*1.9,
    }));
  }

  advance(deltaSeconds:number,acceleration:Readonly<AccelerationVector>,active=true,reducedMotion=false) {
    if(this.disposed||!active||reducedMotion||!Number.isFinite(deltaSeconds)||deltaSeconds<=0)return;
    this.remainder+=Math.min(deltaSeconds,.05);
    while(this.remainder+1e-10>=STEP) {
      this.remainder-=STEP;
      this.time+=STEP;
      this.advanceBirds(acceleration);
      this.advanceClouds(acceleration);
    }
  }

  private advanceBirds(acceleration:Readonly<AccelerationVector>) {
    const ax=clamp(Number.isFinite(acceleration.x)?acceleration.x:0,-100,100);
    const ay=clamp(Number.isFinite(acceleration.y)?acceleration.y:0,-100,100);
    const hasGravity=Math.hypot(ax,ay)>.01;
    for(const bird of this.birds) {
      // Reorient lift gradually. Zero acceleration preserves the last flight frame.
      const targetLift=hasGravity?Math.atan2(-ay,-ax):bird.liftAngle;
      const turn=clamp(angleDifference(bird.liftAngle,targetLift),-1.1*STEP,1.1*STEP);
      bird.liftAngle+=turn;
      bird.phase+=bird.speed*STEP;
      const upX=Math.cos(bird.liftAngle),upY=Math.sin(bird.liftAngle);
      const forwardX=-upY,forwardY=upX;
      const rx=this.width*(bird.kind==='eagle'?.085:.07),ry=this.height*(bird.kind==='eagle'?.06:.045);
      const c=Math.cos(bird.phase),s=Math.sin(bird.phase);
      const targetX=bird.anchorX+forwardX*c*rx+upX*s*ry;
      const targetY=bird.anchorY+forwardY*c*rx+upY*s*ry;
      const tangentX=(-forwardX*s*rx+upX*c*ry)*bird.speed;
      const tangentY=(-forwardY*s*rx+upY*c*ry)*bird.speed;
      const desiredX=clamp(tangentX+(targetX-bird.x)*.5+ax*.035,-28,28);
      const desiredY=clamp(tangentY+(targetY-bird.y)*.5+ay*.035,-22,22);
      bird.vx=approach(bird.vx,desiredX,1.8,STEP);
      bird.vy=approach(bird.vy,desiredY,1.8,STEP);
      bird.x+=bird.vx*STEP;bird.y+=bird.vy*STEP;
      if(Math.hypot(bird.vx,bird.vy)>.2)bird.heading+=clamp(angleDifference(bird.heading,Math.atan2(bird.vy,bird.vx)),-1.9*STEP,1.9*STEP);
      // Eagles glide with occasional slow strokes; small birds flap regularly.
      bird.wingPhase+=(bird.kind==='eagle'?1.1:8.5)*STEP;
    }
  }

  private advanceClouds(acceleration:Readonly<AccelerationVector>) {
    const ax=clamp(Number.isFinite(acceleration.x)?acceleration.x:0,-100,100);
    const ay=clamp(Number.isFinite(acceleration.y)?acceleration.y:0,-100,100);
    for(const cloud of this.clouds) {
      const edgeX=cloud.x<this.width*.04?8:cloud.x>this.width*.96?-8:0;
      const edgeY=cloud.y<this.height*.035?4:cloud.y>this.height*.26?-4:0;
      cloud.vx=approach(cloud.vx,1.5+ax*.055+edgeX,.28,STEP);
      cloud.vy=approach(cloud.vy,Math.sin(this.time*.15+cloud.phase)*.16+ay*.025+edgeY,.45,STEP);
      cloud.x+=cloud.vx*STEP;cloud.y+=cloud.vy*STEP;
    }
  }

  snapshot():AmbientFrame {
    return {width:this.width,height:this.height,time:this.time,
      birds:this.birds.map(({anchorX:_,anchorY:__,phase:___,speed:____,...bird})=>({...bird})),
      clouds:this.clouds.map(({phase:_,...cloud})=>({...cloud})),
    };
  }

  dispose() {
    this.disposed=true;this.birds=[];this.clouds=[];this.remainder=0;this.time=0;
  }
}
