import type { AccelerationVector } from '../../../shared/acceleration';
import { advanceBirdFlock,birdSnapshot,createBirdFlock,type AmbientBird,type BirdFlightState } from './ambient-bird-flight';
export type { AmbientBird } from './ambient-bird-flight';
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
interface CloudState { x: number; y: number; radius: number; vx: number; vy: number; phase: number }

const STEP=1/120;
const approach=(value:number,target:number,rate:number,dt:number)=>value+(target-value)*(1-Math.exp(-rate*dt));
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

// A tiny deterministic background ecosystem. It never creates a Matter body or a timer.
export class AmbientScenery {
  private time=0;
  private remainder=0;
  private disposed=false;
  private birds: BirdFlightState[];
  private clouds: CloudState[];

  constructor(readonly width:number,readonly height:number) {
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Ambient scenery needs a positive viewport.');
    this.birds=createBirdFlock(width,height);
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
      advanceBirdFlock(this.birds,this.width,this.height,acceleration,STEP);
      this.advanceClouds(acceleration);
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
      birds:this.birds.map(birdSnapshot),
      clouds:this.clouds.map(({phase:_,...cloud})=>({...cloud})),
    };
  }

  dispose() {
    this.disposed=true;this.birds=[];this.clouds=[];this.remainder=0;this.time=0;
  }
}
