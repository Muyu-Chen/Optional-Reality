import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { PhysicsWorld } from './world';
import { StarCollection, touchesStar } from './stars';
import type { LevelDefinition } from '../levels/types';

const level: LevelDefinition={...gravityLab,tracks:[],guideLines:[],initialAcceleration:[0,0],
  ball:{...gravityLab.ball,position:[100,200],velocity:[0,0]},
  stars:[{id:'a',position:[300,200]},{id:'b',position:[400,200]},{id:'c',position:[500,200]}]};

describe('star collection independent of the exit',()=>{
  it('collects every swept contact once, including several stars in one step',()=>{
    const stars=new StarCollection(level),actor=Matter.Bodies.circle(700,200,17);
    stars.update(actor,[100,200]);
    expect(stars.snapshot()).toEqual({collected:3,total:3});
    expect(stars.fullScore).toBe(true);
    stars.update(actor,[100,200]);
    expect(stars.collected.size).toBe(3);
  });
  it('permits another collection order and returning for a missed star',()=>{
    const stars=new StarCollection(level),actor=Matter.Bodies.circle(500,200,17);
    stars.update(actor,[500,200]);expect([...stars.collected]).toEqual(['c']);
    Matter.Body.setPosition(actor,{x:300,y:200});stars.update(actor,[300,200]);
    expect(stars.snapshot().collected).toBe(2);
    Matter.Body.setPosition(actor,{x:400,y:200});stars.update(actor,[400,200]);
    expect(stars.fullScore).toBe(true);
  });
  it('uses the actual box shape and rounded corner contact rather than a larger bounding rectangle',()=>{
    const box={...level,ball:{...level.ball,shape:{kind:'box' as const,width:32,height:32}}};
    expect(touchesStar(box,[300,200],10,[330,230],[330,230])).toBe(false);
    expect(touchesStar(box,[300,200],10,[323,223],[323,223])).toBe(true);
    expect(touchesStar(box,[300,200],10,[100,200],[700,200])).toBe(true);
    expect(touchesStar(level,[300,200],10,[100,240],[700,240])).toBe(false);
  });
  it('freezes pickup while paused, rebuilds stars on retry, and never locks an ordinary exit',()=>{
    const world=new PhysicsWorld({...level,exit:{id:'exit',label:'EXIT',x:80,y:180,width:40,height:40}});
    try{
      world.step();expect(world.stars.collected.size).toBe(0);
      world.start();world.step();
      expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(false);
      expect(world.snapshot().stars).toEqual({collected:0,total:3});
      world.stars.collected.add('a');
      const fresh=world.retryWithRules();
      try{expect(fresh.stars.snapshot()).toEqual({collected:0,total:3});}finally{fresh.destroy();}
    }finally{world.destroy();}
  });
  it('freezes overlapping stars before starting and awards final-step pickups before scoring the exit',()=>{
    const world=new PhysicsWorld({...level,
      stars:['a','b','c'].map(id=>({id,position:[100,200] as const})),
      exit:{id:'exit',label:'EXIT',x:80,y:180,width:40,height:40},
    });
    try{
      world.step();expect(world.stars.collected.size).toBe(0);expect(world.won).toBe(false);
      world.start();world.step();
      expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(true);
    }finally{world.destroy();}
  });
  it.each([
    level.stars!.slice(0,2),
    [level.stars![0],level.stars![0],level.stars![2]],
    [{id:'bad',position:[NaN,200] as const},...level.stars!.slice(1)],
    [{id:'bad',position:[900,200] as const},...level.stars!.slice(1)],
    [{id:'bad',position:[300,200] as const,radius:0},...level.stars!.slice(1)],
  ].map(stars=>[stars] as const))('rejects invalid scoring configurations: %#',stars=>{
    expect(()=>new StarCollection({...level,stars})).toThrow();
  });
});
