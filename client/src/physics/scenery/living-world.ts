import type { AccelerationVector } from '../../../../shared/acceleration';
import { sceneryLayout, type SceneryTheme } from './layout';
import { WaterParticles, type WaterParticle, type SprayParticle } from './water-particles';
export type { WaterParticle, SprayParticle } from './water-particles';

export interface SceneryResident {
  readonly kind: 'walker' | 'car'; readonly x: number; readonly y: number;
  readonly vx: number; readonly vy: number; readonly angle: number;
  readonly phase: number; readonly grounded: boolean; readonly palette: number;
}
export interface LivingFrame {
  readonly theme: SceneryTheme; readonly time: number;
  readonly residents: readonly SceneryResident[]; readonly water: readonly WaterParticle[];
  readonly spray:readonly SprayParticle[];
}
interface ResidentState {kind:'walker'|'car';x:number;y:number;vx:number;vy:number;angle:number;phase:number;grounded:boolean;palette:number;cruise:number}
const STEP = 1 / 120;
const finite = (value:number) => Number.isFinite(value) ? Math.max(-100,Math.min(100,value)) : 0;
const approach = (a:number,b:number,rate:number) => a+(b-a)*(1-Math.exp(-rate*STEP));

/** Decorative actors only. No Matter bodies, rule targets, timers or gameplay writes. */
export class LivingWorld {
  private time=0;
  private remainder=0;
  private disposed=false;
  private residents:ResidentState[];
  private waterfall?:WaterParticles;

  constructor(readonly theme:SceneryTheme) {
    this.residents=([
      ['walker',.37,8,0],['walker',.64,-6,1],['car',.18,21,0],['car',.82,-18,1],
    ] as const).map(([kind,x,cruise,palette],i)=>({kind,x:x*1000,
      y:theme==='valley'?sceneryLayout.roadY:410+i*48,vx:theme==='valley'?cruise:cruise*.3,
      vy:theme==='valley'?0:(i%2?-.7:.7),angle:theme==='valley'?0:(i-1)*.23,
      phase:i*1.8,grounded:theme==='valley',palette,cruise}));
    if(theme==='valley')this.waterfall=new WaterParticles();
  }

  advance(delta:number,acceleration:Readonly<AccelerationVector>,active=true,reducedMotion=false) {
    if(this.disposed||!active||reducedMotion||!Number.isFinite(delta)||delta<=0)return;
    this.remainder+=Math.min(delta,.05);
    const ax=finite(acceleration.x),ay=finite(acceleration.y);
    while(this.remainder+1e-10>=STEP) {
      this.remainder-=STEP;this.time+=STEP;
      for(const actor of this.residents)this.advanceResident(actor,ax,ay);
      this.waterfall?.step(ax,ay,STEP);
    }
  }

  private advanceResident(actor:ResidentState,ax:number,ay:number) {
    const surface=this.theme==='valley';
    // A road can support downward acceleration, never pull an actor back against gravity.
    if(surface&&actor.grounded&&ay<=.02){actor.grounded=false;actor.vy=-2;}
    if(actor.grounded) {
      const traction=actor.kind==='car'?.7:.45;
      const slide=Math.max(0,Math.abs(ax)-Math.max(0,ay)*traction)*Math.sign(ax);
      actor.vx=approach(actor.vx,actor.cruise+slide*3,1.5);
      actor.vy=0;actor.y=sceneryLayout.roadY;actor.angle=approach(actor.angle,0,5);
    } else {
      actor.vx+=ax*18*STEP;actor.vy+=ay*18*STEP;
      actor.vx*=1-.035*STEP;actor.vy*=1-.035*STEP;
      const speed=Math.hypot(actor.vx,actor.vy);
      if(speed>220){actor.vx*=220/speed;actor.vy*=220/speed;}
      actor.y+=actor.vy*STEP;
      actor.angle+=(Math.sin(actor.phase)*.2+ax*.045-ay*.025)*STEP;
      if(surface&&ay>0&&actor.vy>=0&&actor.y>=sceneryLayout.roadY) {
        actor.y=sceneryLayout.roadY;actor.vy=0;actor.grounded=true;
      }
      // Wrap distant extras only after they have fully left the illustration.
      if(actor.y < -80){actor.y=780;} else if(actor.y>780){actor.y=-80;}
    }
    actor.x+=actor.vx*STEP;
    if(actor.x < -45)actor.x=1045;else if(actor.x>1045)actor.x=-45;
    actor.phase+=STEP*(actor.grounded?Math.abs(actor.vx)*.3:.7);
  }

  snapshot():LivingFrame {
    const particles=this.waterfall?.snapshot();
    return {theme:this.theme,time:this.time,
      residents:this.residents.map(({cruise:_,...resident})=>({...resident})),
      water:particles?.water??[],spray:particles?.spray??[],
    };
  }

  dispose(){this.disposed=true;this.time=0;this.remainder=0;this.residents=[];this.waterfall?.dispose();}
}
