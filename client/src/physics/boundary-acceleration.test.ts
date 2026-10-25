import {describe,expect,it} from 'vitest';
import type Matter from 'matter-js';
import {bounce} from '../levels/bounce';
import {PhysicsWorld} from './world';

function accelerate(world:PhysicsWorld,x:number,y:number) {
  world.applyMessages([{text:'environment acceleration',operations:[
    {type:'set_property',target:'world',property:'acceleration_x',value:x},
    {type:'set_property',target:'world',property:'acceleration_y',value:y},
  ]}]);
}
function advance(world:PhysicsWorld,ticks:number) {for(let i=0;i<ticks;i++)world.step();}
const activePairs=(world:PhysicsWorld)=>(world.engine.pairs.list as Matter.Pair[]).filter(pair=>pair.isActive);

describe('neutral scene boundaries and weak acceleration',()=>{
  it('constructs containment walls without static or kinetic surface friction',()=>{
    const world=new PhysicsWorld(bounce);
    try {
      const boundaries=world.engine.world.bodies.filter(body=>body.label.startsWith('boundary-'));
      expect(boundaries).toHaveLength(4);
      for(const boundary of boundaries) {
        expect(boundary.isStatic).toBe(true);
        expect(boundary.friction).toBe(0);
        expect(boundary.frictionStatic).toBe(0);
        expect(boundary.restitution).toBe(0);
      }
    }finally{world.destroy();}
  });

  it.each([
    ['bottom right',2,1,'boundary-right','boundary-bottom'],
    ['bottom left',-2,1,'boundary-left','boundary-bottom'],
    ['top right',2,-1,'boundary-right','boundary-top'],
    ['top left',-2,-1,'boundary-left','boundary-top'],
  ] as const)('leaves the %s corner under a weak reverse vertical acceleration while pressed sideways',(_name,x,y,side,vertical)=>{
    const world=new PhysicsWorld(bounce);
    try {
      accelerate(world,x,y);world.start();advance(world,2400);
      expect(world.won||world.timedOut).toBe(false);
      const corner={...world.ball.position},velocity={...world.ball.velocity};
      const contactLabels=activePairs(world).flatMap(pair=>[pair.bodyA.label,pair.bodyB.label]);
      expect(contactLabels).toContain(side);expect(contactLabels).toContain(vertical);
      expect(Math.abs(velocity.y)).toBeLessThan(.03);
      accelerate(world,x,-y);
      // A rule changes acceleration, never position or velocity at send time.
      expect(world.ball.position).toEqual(corner);expect(world.ball.velocity).toEqual(velocity);
      for(const [ticks,minDistance,maxDistance] of [[60,8,13],[60,35,45],[120,145,175]]) {
        advance(world,ticks);
        const travelled=(corner.y-world.ball.position.y)*y;
        expect(travelled).toBeGreaterThan(minDistance);
        expect(travelled).toBeLessThan(maxDistance);
        expect(world.ball.velocity.y*y).toBeLessThan(-.5);
      }
      expect(world.rules.acceleration).toEqual({x,y:-y});
      expect(world.ball.position.x).toBeGreaterThan(14);
      expect(world.ball.position.x).toBeLessThan(786);
    }finally{world.destroy();}
  });

  it('keeps boundary contact friction neutral when players change editable surface friction',()=>{
    const world=new PhysicsWorld(bounce);
    try {
      world.applyMessages([{text:'rough floor',operations:[{type:'set_property',target:'world',property:'friction',value:1}]}]);
      expect(world.engine.world.bodies.filter(body=>body.label==='bounce-floor').every(body=>body.friction===1)).toBe(true);
      accelerate(world,2,1);world.start();advance(world,2400);
      const pairs=activePairs(world).filter(pair=>[pair.bodyA,pair.bodyB].some(body=>body.label.startsWith('boundary-')));
      expect(pairs.length).toBeGreaterThan(0);
      for(const pair of pairs)expect(pair.friction).toBe(0);
      const before=world.ball.position.y;
      accelerate(world,2,-1);advance(world,120);
      expect(world.ball.position.y).toBeLessThan(before-35);
    }finally{world.destroy();}
  });
});
