import Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';
import { playAreaBounds } from './play-area';

/** Half a simulation second at 120 Hz; pause freezes the rim and camera together. */
export function overtimeReveal(world: { overtime: boolean; tick: number; limitTicks: number }, reduced = false) {
  return world.overtime ? (reduced ? 1 : Math.max(0, Math.min(1, (world.tick - world.limitTicks + 1) / 60))) : 0;
}

/** The visible rescue rim and real collision walls share the play-area edges. */
export class OvertimeBoundary {
  active=false;
  activate(engine:Matter.Engine,level:LevelDefinition) {
    if(this.active)return;
    const {left,right,top,bottom}=playAreaBounds(level,true),t=48;
    const w=right-left,h=bottom-top,cx=(left+right)/2,cy=(top+bottom)/2;
    const options={isStatic:true,friction:0,restitution:.08,label:'overtime-boundary'};
    Matter.Composite.add(engine.world,[
      Matter.Bodies.rectangle(left-t/2,cy,t,h+2*t,options),
      Matter.Bodies.rectangle(right+t/2,cy,t,h+2*t,options),
      Matter.Bodies.rectangle(cx,top-t/2,w+2*t,t,options),
      Matter.Bodies.rectangle(cx,bottom+t/2,w+2*t,t,options),
    ]);
    this.active=true;
  }
}
