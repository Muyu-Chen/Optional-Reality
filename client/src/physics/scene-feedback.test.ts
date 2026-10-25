import Matter from 'matter-js';
import { describe,expect,it } from 'vitest';
import { PhysicsWorld } from './world';
import { SceneFeedback } from './scene-feedback';
import { bounce } from '../levels/bounce';
import { oneMoreTurn } from '../levels/one-more-turn';

describe('presentation feedback observes real simulation events',()=>{
  it('shows a pickup once, expires it and never changes world state',()=>{
    const world=new PhysicsWorld(bounce),feedback=new SceneFeedback(world);
    try {
      const star=bounce.stars![0];Matter.Body.setPosition(world.ball,{x:star.position[0],y:star.position[1]});
      world.stars.update(world.ball,star.position);const before=world.snapshot();
      feedback.advance(1);feedback.capture();feedback.capture();
      expect(feedback.active.map(cue=>cue.kind)).toEqual(['star']);
      feedback.advance(1.7);expect(feedback.active).toHaveLength(0);
      expect(world.snapshot()).toEqual(before);
    }finally{feedback.dispose();world.destroy();}
  });
  it('does not replay pickups when reduced motion is changed',()=>{
    const world=new PhysicsWorld(bounce),feedback=new SceneFeedback(world);
    try {
      feedback.advance(1,true);world.stars.collected.add(bounce.stars![0].id);feedback.capture();
      expect(feedback.active).toHaveLength(0);feedback.advance(2,false);feedback.capture();expect(feedback.active).toHaveLength(0);
    }finally{feedback.dispose();world.destroy();}
  });
  it('emits impact cues for a genuine floor collision, then disposes its listener',()=>{
    const world=new PhysicsWorld(bounce),feedback=new SceneFeedback(world);
    try {
      world.start();let impact=false;
      for(let i=0;i<400;i++){feedback.advance(i/120);world.step();feedback.capture();impact ||= feedback.active.some(cue=>cue.kind==='impact');}
      expect(impact).toBe(true);feedback.dispose();
      for(let i=0;i<100;i++){feedback.advance(4+i/120);world.step();}
      expect(feedback.active).toHaveLength(0);
    }finally{feedback.dispose();world.destroy();}
  });
  it('shows spring release only after the real charging phase and clears on a new attempt',()=>{
    const world=new PhysicsWorld(oneMoreTurn),feedback=new SceneFeedback(world);
    try {
      world.setGravity(1);world.start();let release=false;
      for(let i=0;i<500;i++){feedback.advance(i/120);world.step();feedback.capture();release ||= feedback.active.some(cue=>cue.kind==='release');}
      expect(release).toBe(true);expect(world.devices.firedSprings.size).toBe(1);
      const retry=new PhysicsWorld(oneMoreTurn),fresh=new SceneFeedback(retry);
      try{fresh.capture();expect(fresh.active).toHaveLength(0);}finally{fresh.dispose();retry.destroy();}
    }finally{feedback.dispose();world.destroy();}
  });
});
