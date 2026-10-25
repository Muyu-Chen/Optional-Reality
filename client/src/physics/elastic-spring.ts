import Matter from 'matter-js';
import type { DeviceDefinition } from '../levels/types';

type Spring=Extract<DeviceDefinition,{kind:'spring'}>;
export interface ElasticState { phase:'idle'|'charging'|'launched'; elapsed:number; top?:number }

/** A unilateral spring contact. SI force is converted to Matter's px/ms² scale. */
export class ElasticSpring {
  private touching=false;
  constructor(private device:Spring,private body:Matter.Body,private radius:number,private ppm:number,readonly state:ElasticState) {
    this.state.top=device.area.y;
  }
  step(power:number,dt:number): 'contact'|'release'|undefined {
    const {body,device,state}=this,{x,y,width}=device.area;
    const bottom=body.position.y+this.radius;
    const inRange=body.position.x+this.radius>x&&body.position.x-this.radius<x+width;
    if(!inRange||power<=0) {
      this.touching=false;state.phase='idle';state.top=y;return;
    }
    const velocity=Matter.Body.getVelocity(body).y*60/this.ppm;
    let event:'contact'|'release'|undefined;
    if(!this.touching&&body.position.y<y&&bottom>=y&&velocity>0) {
      this.touching=true;state.phase='charging';state.elapsed=0;event='contact';
    }
    if(!this.touching)return;
    if(bottom<y&&velocity<0) {
      this.touching=false;state.phase='launched';state.top=y;return 'release';
    }
    const compression=Math.max(0,(bottom-y)/this.ppm);
    const force=Math.max(0,(device.stiffness ?? 26)*power*compression+(device.damping ?? .15)*velocity);
    Matter.Body.applyForce(body,body.position,{x:0,y:-force*this.ppm/1_000_000});
    state.elapsed+=dt;state.top=Math.max(y,bottom);
    return event;
  }
  refresh() { this.state.top=this.touching?Math.max(this.device.area.y,this.body.position.y+this.radius):this.device.area.y; }
}
