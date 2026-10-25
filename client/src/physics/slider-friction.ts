import Matter from 'matter-js';

/** Coulomb friction impulses for the non-rotating sliding block, in Matter's units. */
export class SliderFriction {
  private freeVelocity={x:0,y:0};
  constructor(private engine:Matter.Engine,private actor:Matter.Body,private surfaceIds:ReadonlySet<string>,private enabled:boolean) {}

  beforeStep(milliseconds:number) {
    if(!this.enabled)return;
    const velocity=Matter.Body.getVelocity(this.actor),gravity=this.engine.gravity;
    // Matter reports velocity per 1/60 second, while forces use pixels/ms².
    const interval=milliseconds*(1000/60);
    this.freeVelocity={
      x:velocity.x+(gravity.x*gravity.scale+this.actor.force.x/this.actor.mass)*interval,
      y:velocity.y+(gravity.y*gravity.scale+this.actor.force.y/this.actor.mass)*interval,
    };
  }

  afterStep() {
    if(!this.enabled)return;
    const velocity=Matter.Body.getVelocity(this.actor);
    const reaction={x:velocity.x-this.freeVelocity.x,y:velocity.y-this.freeVelocity.y};
    const supports:{x:number;y:number;friction:number}[]=[];
    for(const pair of this.engine.pairs.list) {
      if(!pair.isActive || pair.isSensor)continue;
      const collision=pair.collision,a=collision.parentA===this.actor,b=collision.parentB===this.actor;
      if(!a&&!b)continue;
      const surface=a?collision.parentB:collision.parentA;
      if(!surface.isStatic || !this.surfaceIds.has(surface.label) || surface.friction<=0)continue;
      const sign=a?1:-1,x=collision.normal.x*sign,y=collision.normal.y*sign;
      // A track can have several overlapping pieces at a seam; count its normal load once.
      const same=supports.find(normal=>normal.x*x+normal.y*y>.999);
      if(same)same.friction=Math.max(same.friction,surface.friction);
      else supports.push({x,y,friction:surface.friction});
    }
    for(const normal of supports) {
      const normalImpulsePerMass=Math.max(0,reaction.x*normal.x+reaction.y*normal.y);
      const tx=-normal.y,ty=normal.x,tangent=velocity.x*tx+velocity.y*ty;
      const impulse=Math.min(Math.abs(tangent),normal.friction*normalImpulsePerMass)*Math.sign(tangent);
      velocity.x-=tx*impulse;velocity.y-=ty*impulse;
    }
    if(supports.length)Matter.Body.setVelocity(this.actor,velocity);
  }
}
