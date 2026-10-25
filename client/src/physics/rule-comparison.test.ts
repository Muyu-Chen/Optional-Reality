import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { levels, findLevel } from '../levels/catalog';
import { PhysicsWorld } from './world';
import { RuleComparison } from './rule-comparison';

const change=(world:PhysicsWorld,y:number)=>world.applyMessages([{text:`set acceleration ${y}`,operations:[{type:'set_property',target:'world',property:'acceleration_y',value:y}]}]);
const advance=(world:PhysicsWorld,n:number)=>{world.start();for(let i=0;i<n;i++){if(world.tutorialId)world.continueTutorial();world.step();}};

describe('same-engine counterfactual trajectories', () => {
  it.each(levels)('reconstructs the exact pre-change state in $id',level=>{
    const seen=level.tutorials?.map(item=>item.id),live=new PhysicsWorld(level,seen),oracle=new PhysicsWorld(level,seen);
    let branch:PhysicsWorld|null=null;
    try {
      live.setGravity(1);oracle.setGravity(1);advance(live,80);advance(oracle,80);
      const snapshot=live.snapshot();change(live,-1);branch=live.forkBeforeLastRuleChange();
      expect(branch,level.id).not.toBeNull();
      expect(branch!.rules.acceleration.y).toBe(1);
      for(let i=0;i<144;i++){
        branch!.step();oracle.step();
        expect(branch!.ball.position.x).toBeCloseTo(oracle.ball.position.x,7);
        expect(branch!.ball.position.y).toBeCloseTo(oracle.ball.position.y,7);
      }
      expect(live.tick).toBe(snapshot.tick);expect(live.ball.position.x).toBe(snapshot.x);
      expect(live.rules.acceleration.y).toBe(-1);expect(live.commandCount).toBe(1);
    } finally {branch?.destroy();live.destroy();oracle.destroy();}
  });
  it('replays spring teaching pauses and charge state, without a position-only clone',()=>{
    const live=new PhysicsWorld(findLevel('toaster')!);let branch:PhysicsWorld|null=null;
    try {
      live.applyMessages([{text:"toaster",operations:[{type:"set_property",target:"spring-main",property:"spring_power",value:2}]}]);live.start();for(let i=0;i<1800 && !live.tutorialId && !live.timedOut;i++)live.step();
      expect(live.tutorialId).toBeTruthy();live.continueTutorial();advance(live,12);change(live,-1);
      branch=live.forkBeforeLastRuleChange();expect(branch).not.toBeNull();
      expect([...branch!.devices.springs.values()].map(s=>[s.phase,s.elapsed])).toEqual([...live.devices.springs.values()].map(s=>[s.phase,s.elapsed]));
    }finally{branch?.destroy();live.destroy();}
  });
  it('preserves collision history after a real rebound',()=>{
    const level=findLevel('multi-bounce')!,live=new PhysicsWorld(level),oracle=new PhysicsWorld(level);let branch:PhysicsWorld|null=null;
    try{
      for(const world of [live,oracle]){
        world.applyMessages([{text:'bounce',operations:[{type:'set_property',target:'world',property:'restitution',value:.9}]}]);advance(world,400);
      }
      change(live,-10);branch=live.forkBeforeLastRuleChange();expect(branch).not.toBeNull();
      for(let i=0;i<100;i++){branch!.step();oracle.step();expect(branch!.ball.position.y).toBeCloseTo(oracle.ball.position.y,7);}
    }finally{branch?.destroy();live.destroy();oracle.destroy();}
  });
  it('rebuilds overtime collision walls from recorded steps',()=>{
    const live=new PhysicsWorld(findLevel('gravity-lab')!);let branch:PhysicsWorld|null=null;
    try{advance(live,3600);expect(live.overtime).toBe(true);change(live,-1);branch=live.forkBeforeLastRuleChange();expect(branch?.overtime).toBe(true);}
    finally{branch?.destroy();live.destroy();}
  });
  it('fails closed if an external mutation cannot be reproduced',()=>{
    const live=new PhysicsWorld(findLevel('bounce')!);
    try {advance(live,20);Matter.Body.setPosition(live.ball,{x:400,y:300});change(live,-1);expect(live.forkBeforeLastRuleChange()).toBeNull();}
    finally{live.destroy();}
  });
  it('shows the first reversal, records actual motion, and clears on the next edit',()=>{
    const live=new PhysicsWorld(findLevel('bounce')!),cue=new RuleComparison();
    try {
      advance(live,20);change(live,-1);cue.captureRule(live);
      expect(cue.view.reference.length).toBeGreaterThan(2);
      for(let i=0;i<30;i++){live.step();cue.captureStep(live);}
      expect(cue.view.actual.at(-1)).toEqual([live.ball.position.x,live.ball.position.y]);
      change(live,2);cue.captureRule(live);expect(cue.view.reference).toEqual([]);
      const reduced=new RuleComparison();change(live,-2);reduced.captureRule(live,true);expect(reduced.view.reference).toEqual([]);
    }finally{live.destroy();}
  });
});
