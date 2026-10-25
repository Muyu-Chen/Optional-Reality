import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { PhysicsWorld } from './world';
import { findLevel } from '../levels/catalog';
import { completionStars } from '../domain/round';

const level={...findLevel('gravity-lab')!,tracks:[],exit:{id:'exit',label:'Exit',x:20,y:20,width:10,height:10}};
const begin=()=>{const world=new PhysicsWorld(level);world.start();for(let i=0;i<3600;i++)world.step();return world;};

describe('one 30-second rescue overtime',()=>{
  it('creates four real walls once, adds exactly 30s and excludes pause time',()=>{
    const world=begin();
    try{
      expect(world.snapshot()).toMatchObject({overtime:true,running:true,timedOut:false,tick:3600});
      expect(Matter.Composite.allBodies(world.engine.world).filter(body=>body.label==='overtime-boundary')).toHaveLength(4);
      world.pause();for(let i=0;i<240;i++)world.step();expect(world.tick).toBe(3600);
      world.start();for(let i=0;i<3599;i++)world.step();expect(world.timedOut).toBe(false);
      world.step();expect(world.snapshot()).toMatchObject({tick:7200,running:false,timedOut:true,overtime:true});
      world.start();world.step();expect(world.tick).toBe(7200);
      expect(Matter.Composite.allBodies(world.engine.world)).toHaveLength(5);
    }finally{world.destroy();}
  });
  it.each([
    [35,255,-4,0],[765,255,4,0],[400,35,0,-4],[400,475,0,4],
  ])('physically contains motion toward an edge from %s,%s', (x,y,vx,vy)=>{
    const world=begin();
    try {
      Matter.Body.setPosition(world.ball,{x,y});Matter.Body.setVelocity(world.ball,{x:vx,y:vy});
      for(let i=0;i<120;i++)world.step();
      expect(world.fell).toBe(false);expect(world.timedOut).toBe(false);
      expect(world.ball.position.x).toBeGreaterThanOrEqual(world.level.ball.radius-3);
      expect(world.ball.position.x).toBeLessThanOrEqual(800-world.level.ball.radius+3);
      expect(world.ball.position.y).toBeGreaterThanOrEqual(world.level.ball.radius-3);
      expect(world.ball.position.y).toBeLessThanOrEqual(510-world.level.ball.radius+3);
    }finally{world.destroy();}
  });
  it('keeps early escapes as failures and allows a last normal-tick win without penalty',()=>{
    const escaped=new PhysicsWorld(level),won=new PhysicsWorld(level);
    try{
      Matter.Body.setPosition(escaped.ball,{x:900,y:200});escaped.start();escaped.step();
      expect(escaped.fell).toBe(true);expect(escaped.overtime).toBe(false);
      won.tick=3599;Matter.Body.setPosition(won.ball,{x:25,y:25});won.start();won.step();
      expect(won.won).toBe(true);expect(won.overtime).toBe(false);
    }finally{escaped.destroy();won.destroy();}
  });
  it.each([0,1,2,3])('deducts one earned star from %s pickups without going negative',collected=>{
    expect(completionStars(collected,true)).toBe(Math.max(0,collected-1));
    expect(completionStars(collected,false)).toBe(collected);
  });
  it('a new attempt starts without rescue walls or penalty',()=>{
    const previous=begin(),fresh=new PhysicsWorld(level);
    try{expect(fresh.overtime).toBe(false);expect(fresh.tick).toBe(0);expect(Matter.Composite.allBodies(fresh.engine.world)).toHaveLength(1);}
    finally{previous.destroy();fresh.destroy();}
  });
});
