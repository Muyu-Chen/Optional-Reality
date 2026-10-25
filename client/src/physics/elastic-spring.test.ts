import Matter from 'matter-js';
import { describe,expect,it } from 'vitest';
import { oneMoreTurn } from '../levels/one-more-turn';
import { PhysicsWorld } from './world';

describe('passive elastic spring mechanics',()=>{
  it('applies restoring force without freezing, moving or assigning velocity to the actor',()=>{
    const world=new PhysicsWorld(oneMoreTurn);
    try {
      Matter.Body.setPosition(world.ball,{x:400,y:409});Matter.Body.setVelocity(world.ball,{x:.4,y:2});
      const position={...world.ball.position},velocity=Matter.Body.getVelocity(world.ball);
      world.devices.beforeStep(world.rules,1/120);
      expect(world.ball.position).toEqual(position);expect(Matter.Body.getVelocity(world.ball)).toEqual(velocity);
      expect(world.ball.force.x).toBe(0);expect(world.ball.force.y).toBeLessThan(0);
      expect(world.engine.world.constraints).toHaveLength(0);
    }finally{world.destroy();}
  });
  it('compresses, crosses zero velocity continuously, and cannot bounce above its drop height',()=>{
    const world=new PhysicsWorld(oneMoreTurn);
    try {
      world.setGravity(1);world.start();let wasDown=false,turned=false,released=false,minAfter=Infinity,maxCompression=0,maxDelta=0;
      let previous=Matter.Body.getVelocity(world.ball).y*60/80;
      const mass=world.ball.mass,initialEnergy=-mass*300/80;let maximumEnergy=initialEnergy;
      for(let i=0;i<900;i++) {
        world.step();const state=world.devices.springs.get('fixed-spring')!;
        const velocity=Matter.Body.getVelocity(world.ball).y*60/80;
        maxDelta=Math.max(maxDelta,Math.abs(velocity-previous));previous=velocity;
        const compression=Math.max(0,(state.top!-420)/80);
        maxCompression=Math.max(maxCompression,compression*80);
        maximumEnergy=Math.max(maximumEnergy,.5*mass*velocity**2-mass*world.ball.position.y/80+.5*26*compression**2);
        if(state.phase==='charging') { wasDown ||= velocity>0;turned ||= wasDown&&velocity<=0; }
        released ||= world.devices.firedSprings.size>0;
        if(released)minAfter=Math.min(minAfter,world.ball.position.y);
      }
      expect(turned).toBe(true);expect(released).toBe(true);expect(maxCompression).toBeGreaterThan(15);
      expect(maxDelta).toBeLessThan(.15);expect(minAfter).toBeGreaterThanOrEqual(299.5);
      expect(maximumEnergy).toBeLessThanOrEqual(initialEnergy+.025);
      expect(world.stars.collected.size).toBe(1);expect(world.won).toBe(false);
    }finally{world.destroy();}
  });
  it('compresses farther for a heavier body under the same spring stiffness',()=>{
    const compression=(factor:number)=>{
      const world=new PhysicsWorld(oneMoreTurn);
      try {
        Matter.Body.setMass(world.ball,world.ball.mass*factor);world.setGravity(1);world.start();let maximum=0;
        for(let i=0;i<400;i++){world.step();maximum=Math.max(maximum,(world.devices.springs.get('fixed-spring')?.top??420)-420);}
        return maximum;
      }finally{world.destroy();}
    };
    expect(compression(1.8)).toBeGreaterThan(compression(1)+5);
  });
  it('does not pull a separated ball, catch it from below, or act outside the plunger width',()=>{
    const world=new PhysicsWorld(oneMoreTurn);
    try {
      for(const position of [{x:400,y:300},{x:250,y:420},{x:400,y:450}]) {
        Matter.Body.setPosition(world.ball,position);Matter.Body.setVelocity(world.ball,{x:0,y:1});world.ball.force={x:0,y:0};
        world.devices.beforeStep(world.rules,1/120);expect(world.ball.force).toEqual({x:0,y:0});
      }
    }finally{world.destroy();}
  });
});
