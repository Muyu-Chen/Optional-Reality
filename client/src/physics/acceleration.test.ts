import { describe, expect, it } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { PhysicsWorld } from './world';

describe('environment acceleration axes', () => {
  it('applies downward 20 and then upward 20 through the same vector without changing velocity instantly',()=>{
    const world=new PhysicsWorld({...gravityLab,tracks:[],guideLines:[],ball:{...gravityLab.ball,position:[300,180]}});
    try{
      world.applyMessages([{text:'down',operations:[{type:'set_gravity',acceleration:20}]}]);world.start();
      for(let i=0;i<60;i++)world.step();
      expect(world.engine.gravity.y).toBe(20);expect(world.ball.position.y).toBeCloseTo(383.33,1);
      const velocity=world.ball.velocity.y;
      world.applyMessages([{text:'up',operations:[{type:'set_property',target:'world',property:'acceleration_y',value:-20}]}]);
      expect(world.ball.velocity.y).toBe(velocity);world.step();
      expect(world.ball.velocity.y).toBeGreaterThan(0);expect(world.ball.velocity.y).toBeLessThan(velocity);
      expect(world.rules.acceleration).toEqual({x:0,y:-20});
    }finally{world.destroy();}
  });
  it('uses m/s², keeps inertia after stopping, and undoes/retries without velocity edits', () => {
    const world=new PhysicsWorld({...gravityLab,tracks:[],guideLines:[],ball:{...gravityLab.ball,position:[300,180]}});
    try {
      world.applyMessages([{text:'right',operations:[{type:'set_property',target:'world',property:'acceleration_x',value:2}]}]);
      world.start(); for(let i=0;i<60;i++)world.step();
      expect(world.ball.position.x).toBeCloseTo(320.33,1);
      expect(world.ball.position.y).toBeCloseTo(180,8);
      const x=world.ball.position.x,velocity=world.ball.velocity.x;
      world.applyMessages([{text:'stop',operations:[{type:'set_property',target:'world',property:'acceleration_x',value:0}]}]);
      for(let i=0;i<60;i++)world.step();
      expect(world.ball.position.x-x).toBeCloseTo(40,1);
      expect(world.ball.velocity.x).toBeCloseTo(velocity,8);
      expect(world.undoRule()).toBe(true); expect(world.engine.gravity.x).toBe(2);
      const before={...world.ball.velocity}; world.pause(); world.step();
      expect(world.ball.velocity).toEqual(before);
      const fresh=new PhysicsWorld(world.level);
      try { expect(fresh.engine.gravity.x).toBe(0); expect(fresh.ball.position.x).toBe(300); } finally { fresh.destroy(); }
    } finally {world.destroy();}
  });
  it('changes acceleration rather than instantly reversing velocity, independently of gravity', () => {
    const world=new PhysicsWorld({...gravityLab,tracks:[],ball:{...gravityLab.ball,position:[300,180]}});
    try {
      world.applyMessages([{text:'two axes',operations:[{type:'set_property',target:'world',property:'acceleration_x',value:2},{type:'set_gravity',acceleration:1}]}]);
      world.start();for(let i=0;i<60;i++)world.step();
      const velocity=world.ball.velocity.x;
      world.applyMessages([{text:'reverse',operations:[{type:'scale_property',target:'world',property:'acceleration_x',factor:-1}]}]);
      expect(world.ball.velocity.x).toBe(velocity);
      world.step();expect(world.ball.velocity.x).toBeGreaterThan(0);expect(world.ball.velocity.x).toBeLessThan(velocity);
      expect(world.engine.gravity.y).toBe(1);expect(world.engine.gravity.x).toBe(-2);
    } finally {world.destroy();}
  });
});
