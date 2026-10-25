import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { PhysicsWorld } from './world';
import { findLevel } from '../levels/catalog';
import { completionStars } from '../domain/round';
import { frictionRunway } from '../levels/friction-runway';
import { actorBounds } from './play-area';

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
      expect(world.ball.position.x).toBeLessThanOrEqual(960-world.level.ball.radius+3);
      expect(world.ball.position.y).toBeGreaterThanOrEqual(-102+world.level.ball.radius-3);
      expect(world.ball.position.y).toBeLessThanOrEqual(510-world.level.ball.radius+3);
    }finally{world.destroy();}
  });
  it('places collision faces exactly at the expanded visible rectangle, with closed corners',()=>{
    const world=begin();
    try{
      expect(world.playArea).toEqual({left:0,right:960,top:-102,bottom:510});
      const walls=Matter.Composite.allBodies(world.engine.world).filter(body=>body.label==='overtime-boundary');
      const [left,right,top,bottom]=walls;
      expect(left.bounds.max.x).toBe(0);expect(right.bounds.min.x).toBe(960);
      expect(top.bounds.max.y).toBe(-102);expect(bottom.bounds.min.y).toBe(510);
      for(const side of [left,right]) {
        expect(side.bounds.min.y).toBeLessThan(top.bounds.max.y);
        expect(side.bounds.max.y).toBeGreaterThan(bottom.bounds.min.y);
      }
    }finally{world.destroy();}
  });
  it.each([
    [850,255,1,0],[400,-45,0,-1],
  ])('keeps the added space playable past the old edge at %s,%s',(x,y,vx,vy)=>{
    const world=begin();
    try {
      Matter.Body.setPosition(world.ball,{x,y});Matter.Body.setVelocity(world.ball,{x:vx,y:vy});
      world.step();
      expect(world.snapshot()).toMatchObject({running:true,timedOut:false,outOfBounds:null});
      expect(world.ball.velocity.x*vx+world.ball.velocity.y*vy).toBeGreaterThan(0);
    }finally{world.destroy();}
  });
  it.each([
    [925,200,4,0],[400,-67,0,-4],[925,-67,4,-4],
  ])('contains motion at a new rescue edge or corner from %s,%s',(x,y,vx,vy)=>{
    const world=begin();
    try {
      Matter.Body.setPosition(world.ball,{x,y});Matter.Body.setVelocity(world.ball,{x:vx,y:vy});
      for(let i=0;i<120;i++)world.step();
      expect(world.snapshot()).toMatchObject({running:true,outOfBounds:null});
      expect(world.ball.position.x).toBeLessThanOrEqual(960-world.level.ball.radius+3);
      expect(world.ball.position.y).toBeGreaterThanOrEqual(-102+world.level.ball.radius-3);
      if(vx>0)expect(world.ball.velocity.x).toBeLessThanOrEqual(0);
      if(vy<0)expect(world.ball.velocity.y).toBeGreaterThanOrEqual(0);
    }finally{world.destroy();}
  });
  it.each([[900,200],[400,-45]])('keeps early escapes as failures at %s,%s',(x,y)=>{
    const world=new PhysicsWorld(level);
    try {
      Matter.Body.setPosition(world.ball,{x,y});world.start();world.step();
      expect(world.fell).toBe(true);expect(world.overtime).toBe(false);
    }finally{world.destroy();}
  });
  it('allows a last normal-tick win without penalty',()=>{
    const won=new PhysicsWorld(level);
    try{
      won.tick=3599;Matter.Body.setPosition(won.ball,{x:25,y:25});won.start();won.step();
      expect(won.won).toBe(true);expect(won.overtime).toBe(false);
    }finally{won.destroy();}
  });
  it('also contains a rotated sliding block in the added top-right space',()=>{
    const blockLevel={...frictionRunway,initialAcceleration:[0,0] as const,tracks:[],exit:level.exit};
    const world=new PhysicsWorld(blockLevel);
    try {
      Matter.Body.setVelocity(world.ball,{x:0,y:0});world.start();
      for(let i=0;i<3600;i++)world.step();
      Matter.Body.setAngle(world.ball,Math.PI/4);
      Matter.Body.setPosition(world.ball,{x:925,y:-67});Matter.Body.setVelocity(world.ball,{x:4,y:-4});
      for(let i=0;i<120;i++)world.step();
      expect(world.snapshot()).toMatchObject({running:true,outOfBounds:null,overtime:true});
      const bounds=actorBounds(world.ball,blockLevel);
      expect(bounds.max.x).toBeLessThanOrEqual(961);
      expect(bounds.min.y).toBeGreaterThanOrEqual(-103);
    }finally{world.destroy();}
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
