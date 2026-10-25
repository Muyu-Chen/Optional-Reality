import Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';

/** The visible rescue rim and real collision walls share the play-area edges. */
export class OvertimeBoundary {
  active=false;
  activate(engine:Matter.Engine,level:LevelDefinition) {
    if(this.active)return;
    const {width:w,height:h}=level.viewport,t=48;
    const options={isStatic:true,friction:0,restitution:.08,label:'overtime-boundary'};
    Matter.Composite.add(engine.world,[
      Matter.Bodies.rectangle(-t/2,h/2,t,h+2*t,options),
      Matter.Bodies.rectangle(w+t/2,h/2,t,h+2*t,options),
      Matter.Bodies.rectangle(w/2,-t/2,w+2*t,t,options),
      Matter.Bodies.rectangle(w/2,h+t/2,w+2*t,t,options),
    ]);
    this.active=true;
  }
}
