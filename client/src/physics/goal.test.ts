import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { gravityLab } from '../levels/gravity-lab';
import type { LevelDefinition } from '../levels/types';
import { GoalTracker } from './goal';
import { PhysicsWorld } from './world';

const fixture: LevelDefinition = {
  ...gravityLab, tracks: [], guideLines: [],
  ball: { ...gravityLab.ball, position: [200,200], radius: 10 },
  exit: { id:'goal', label:'HOLD', x:150, y:150, width:100, height:100, condition:{kind:'settle',seconds:1,maxSpeed:.1} },
};

describe('shape-aware settling goals', () => {
  it.each([30,60,120])('requires one continuous second at %s Hz, not mere contact', rate => {
    const goal=new GoalTracker(fixture), body=Matter.Bodies.circle(200,200,10);
    for(let i=0;i<rate-1;i++)expect(goal.update(body,1/rate)).toBe(false);
    expect(goal.update(body,1/rate)).toBe(true);
    expect(goal.progress).toBe(1);
  });
  it.each([[155,200],[200,245],[250,250]])('rejects partial containment at %s,%s', (x,y) => {
    const goal=new GoalTracker(fixture), body=Matter.Bodies.circle(x,y,10);
    expect(goal.update(body,2)).toBe(false);
    expect(goal.progress).toBe(0);
  });
  it('resets accumulated progress when leaving or moving too fast, with speed measured in m/s', () => {
    const goal=new GoalTracker(fixture), body=Matter.Bodies.circle(200,200,10);
    goal.update(body,.5); expect(goal.progress).toBe(.5);
    Matter.Body.setVelocity(body,{x:.2,y:0}); // 0.15 m/s at 80 pixels/metre.
    expect(goal.update(body,1)).toBe(false);expect(goal.progress).toBe(0);
    Matter.Body.setVelocity(body,{x:0,y:0});goal.update(body,.5);
    Matter.Body.setPosition(body,{x:300,y:200});goal.update(body,.1);
    expect(goal.progress).toBe(0);
    Matter.Body.setPosition(body,{x:200,y:200});expect(goal.update(body,.5)).toBe(false);
  });
  it('uses the entire box and does not mistake a narrow touching corner for a parked block', () => {
    const level={...fixture,ball:{...fixture.ball,shape:{kind:'box' as const,width:60,height:20}}};
    const goal=new GoalTracker(level), body=Matter.Bodies.rectangle(170,200,60,20);
    expect(goal.update(body,2)).toBe(false);
    Matter.Body.setPosition(body,{x:200,y:200});expect(goal.update(body,1)).toBe(true);
  });
  it('does not advance goal time while the world is paused and clears it on retry', () => {
    const world=new PhysicsWorld(fixture);
    try {
      world.start();for(let i=0;i<60;i++)world.step();
      expect(world.goal.progress).toBeCloseTo(.5);
      world.pause();for(let i=0;i<120;i++)world.step();
      expect(world.goal.progress).toBeCloseTo(.5);expect(world.won).toBe(false);
      const fresh=world.retryWithRules();
      try {expect(fresh.goal.progress).toBe(0);expect(fresh.tick).toBe(0);}finally{fresh.destroy();}
      world.start();for(let i=0;i<60;i++)world.step();expect(world.won).toBe(true);
    } finally {world.destroy();}
  });
  it.each([{seconds:0,maxSpeed:1},{seconds:1,maxSpeed:-1},{seconds:Infinity,maxSpeed:1}])('rejects invalid dwell configuration: %j', condition => {
    expect(()=>new GoalTracker({...fixture,exit:{...fixture.exit,condition:{kind:'settle',...condition}}})).toThrow('Invalid');
  });
});
