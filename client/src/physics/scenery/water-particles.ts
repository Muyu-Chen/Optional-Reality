import { sceneryLayout } from './layout';

export interface WaterParticle {
  readonly x:number; readonly y:number; readonly vx:number; readonly vy:number;
  readonly age:number; readonly lane:number; readonly radius:number;
}
export interface SprayParticle {
  readonly x:number; readonly y:number; readonly age:number; readonly life:number; readonly radius:number;
}
interface DropState {x:number;y:number;vx:number;vy:number;age:number;lane:number;radius:number}
interface SprayState extends SprayParticle {x:number;y:number;vx:number;vy:number;age:number}
export const WATER_PARTICLE_COUNT=360;
const LIFE=2.4,SPEED=75,MAX_SPRAY=24;

/** Deterministic emitter, stepped only by the owning background's fixed clock. */
export class WaterParticles {
  private drops:DropState[];
  private spray:SprayState[]=[];

  constructor() {
    const {x,y,width,poolY}=sceneryLayout.waterfall;
    const flightTime=(-SPEED+Math.sqrt(SPEED*SPEED+60*(poolY-y)))/30;
    this.drops=Array.from({length:WATER_PARTICLE_COUNT},(_,i)=>{
      const age=i/WATER_PARTICLE_COUNT*flightTime,lane=(i*73%WATER_PARTICLE_COUNT)/WATER_PARTICLE_COUNT;
      return {x:x+lane*width,y:y+SPEED*age+15*age*age,vx:0,vy:SPEED+30*age,
        age,lane,radius:.7+(i*11%19)/19};
    });
  }

  step(ax:number,ay:number,dt:number) {
    if(!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,1/120);
    ax=Number.isFinite(ax)?Math.max(-100,Math.min(100,ax)):0;
    ay=Number.isFinite(ay)?Math.max(-100,Math.min(100,ay)):0;
    const {x,y,width,poolY}=sceneryLayout.waterfall;
    for(let i=0;i<this.drops.length;i++) {
      const drop=this.drops[i];drop.age+=dt;
      drop.vx+=ax*30*dt;drop.vy+=ay*30*dt;drop.x+=drop.vx*dt;drop.y+=drop.vy*dt;
      const landed=drop.vy>0&&drop.y>=poolY&&drop.x>x-60&&drop.x<x+width+80;
      if(landed&&i%24===0&&this.spray.length+2<=MAX_SPRAY) {
        for(const sign of [-1,1])this.spray.push({x:drop.x,y:poolY,vx:sign*(13+i%9),vy:-22-i%11,
          age:0,life:.4+(i%5)*.02,radius:.8+(i%3)*.2});
      }
      if(landed||drop.age>=LIFE||drop.y < -40||drop.y>710||drop.x < -60||drop.x>1060) {
        drop.age=0;drop.x=x+drop.lane*width;drop.y=y;
        const magnitude=Math.hypot(ax,ay);
        // Source pressure keeps emitting; previously emitted water keeps its own momentum.
        drop.vx=magnitude>.02?ax/magnitude*SPEED:0;drop.vy=magnitude>.02?ay/magnitude*SPEED:SPEED;
      }
    }
    for(const particle of this.spray) {
      particle.age+=dt;particle.vx+=ax*30*dt;particle.vy+=ay*30*dt;
      particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;
    }
    this.spray=this.spray.filter(particle=>particle.age<particle.life);
  }

  snapshot(){return {water:this.drops.map(drop=>({...drop})),spray:this.spray.map(({vx:_vx,vy:_vy,...particle})=>({...particle}))};}
  dispose(){this.drops=[];this.spray=[];}
}
