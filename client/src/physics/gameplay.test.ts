import { describe, expect, it } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { bounce } from '../levels/bounce';
import { realityBreakdown } from '../levels/reality-breakdown';
import { toaster } from '../levels/toaster';
import { breeze } from '../levels/breeze';
import { levels } from '../levels/catalog';
import { initialRules, ruleContext } from '../levels/rules';
import { PhysicsWorld } from './world';
import { applyRules, validateRuleState } from '../../../shared/rules';
import { messageOperations, nextMessage, prepareMessage, retryMessages, applyBatch } from '../domain/queue';

function apply(world: PhysicsWorld, text: string) {
  const message=prepareMessage(text,text,ruleContext(world.level),world.rules);
  if(message.status !== 'ready')throw new Error(message.error);
  world.applyMessages([{text,operations:messageOperations(message)}]);
}
function advance(world: PhysicsWorld, count=7200) {
  world.start();for(let i=0;i<count && world.running;i++)world.step();
}

describe('three playable chapters',()=>{
  it('has ordered stable IDs, with valid initial states independent from editing permissions',()=>{
    expect(levels.map(level=>level.id)).toEqual(['gravity-lab','one-more-turn','bounce','multi-bounce','friction-runway','catch-cup','toaster','breeze','reality-breakdown']);
    expect(levels.at(-1)?.id).toBe('reality-breakdown');
    for(const level of levels)expect(()=>validateRuleState(initialRules(level),ruleContext(level))).not.toThrow();
    expect(()=>applyRules(initialRules(gravityLab),[{type:'set_property',target:'world',property:'friction',value:.1}],ruleContext(gravityLab))).not.toThrow();
    expect(()=>applyRules(initialRules(bounce),[{type:'set_gravity',acceleration:0}],ruleContext(bounce))).not.toThrow();
    expect(()=>applyRules(initialRules(bounce),[{type:'set_property',target:'bounce-floor',property:'friction',value:.1}],ruleContext(bounce))).not.toThrow();
  });
  it.each([.8,.85,.9,.95,1])('wins the reflection puzzle with bounce %s',value=>{
    const world=new PhysicsWorld(bounce);
    try{apply(world,`Set surface bounce to ${value}`);advance(world);expect(world.won,JSON.stringify(world.snapshot())).toBe(true);}finally{world.destroy();}
  });
  it.each([575,600,625,650])('accepts a range of gravity-off moments at x=%s',threshold=>{
    const world=new PhysicsWorld(gravityLab);
    try{apply(world,'add gravity');world.start();let sent=false;for(let i=0;i<3600 && world.running;i++){if(!sent&&world.ball.position.x>=threshold){apply(world,'stop gravity');sent=true;}world.step();}expect(world.won).toBe(true);}finally{world.destroy();}
  });
  it('requires a change of timing in the teaching ramp instead of winning with gravity left on',()=>{
    const world=new PhysicsWorld(gravityLab);try{apply(world,'add gravity');advance(world);expect(world.won).toBe(false);}finally{world.destroy();}
  });
  it.each([0,60,120,240])('accepts a generous bounce timing window: tick %s',tick=>{
    const world=new PhysicsWorld(bounce);
    try{advance(world,tick);apply(world,'Set surface bounce to 0.9');advance(world);expect(world.won).toBe(true);}finally{world.destroy();}
  });
  it.each([toaster,breeze])('teaches one device at a time in $id',level=>{
    const world=new PhysicsWorld(level);
    try{
      for(const text of level.instructions.exampleMessages)apply(world,text);
      world.start();for(let i=0;i<3600 && !world.won && !world.timedOut;i++){if(world.tutorialId)world.continueTutorial();world.step();}
      expect(world.won,JSON.stringify(world.snapshot())).toBe(true);
      expect(()=>applyRules(initialRules(level),[{type:'set_property',target:'belt-main',property:'conveyor_speed',value:2}],ruleContext(level))).toThrow('cannot be edited');
    }finally{world.destroy();}
  });
  it('does not accidentally complete any chapter using the default world',()=>{
    for(const level of levels){const world=new PhysicsWorld(level);try{advance(world);expect(world.won).toBe(false);expect(world.timedOut).toBe(true);}finally{world.destroy();}}
  });
  it('retries the initial scene, time, budget and compiled queue without a model request',()=>{
    for(const level of levels){
      const world=new PhysicsWorld(level);
      try{
        const messages=level.instructions.exampleMessages.map((text,i)=>prepareMessage(String(i),text,ruleContext(level),world.rules));
        const sent=applyBatch(messages,messages.map(message=>message.id),world.rules,0,ruleContext(level));
        world.applyMessages(sent.events.map(event=>({text:event.text,operations:event.operations})));advance(world,30);
        const retried=retryMessages(sent.messages),fresh=new PhysicsWorld(level,world.seenTutorials);
        try{expect(retried.every(message=>message.status==='ready')).toBe(true);expect(retried.map(messageOperations)).toEqual(messages.map(messageOperations));expect(fresh.rules).toEqual(initialRules(level));expect(fresh.tick).toBe(0);expect(fresh.commandCount).toBe(0);expect(fresh.ball.position).toEqual({x:level.ball.position[0],y:level.ball.position[1]});}finally{fresh.destroy();}
      }finally{world.destroy();}
    }
  });
  it('does not skip an invalid head message to execute a later ready message',()=>{
    const messages=[prepareMessage('bad','teleport the ball'),prepareMessage('ready','add gravity')];
    expect(nextMessage(messages)?.id).toBe('bad');
    expect(nextMessage(messages.filter(message=>message.id!=='bad'))?.id).toBe('ready');
  });
});

describe('toaster interaction and first encounter',()=>{
  function setup(){const world=new PhysicsWorld(realityBreakdown);for(const text of realityBreakdown.instructions.exampleMessages)apply(world,text);return world;}
  it('pauses on first contact and freezes charging, countdown and physics until Continue',()=>{
    const world=setup();
    try{
      advance(world);expect(world.tutorialId).toBe('toaster-charge');expect(world.devices.firedSprings.size).toBe(0);
      const tick=world.tick,position={...world.ball.position};
      for(let i=0;i<240;i++)world.step();
      expect(world.tick).toBe(tick);expect(world.ball.position).toEqual(position);
      apply(world,'Set fan power to 0.5');world.start();expect(world.running).toBe(false);
      world.continueTutorial();advance(world,60);
      expect(world.devices.firedSprings.size).toBe(0);
      // 0.6s at 120 Hz, regardless of the rendering frame rate.
      advance(world,12);expect(world.devices.firedSprings.has('spring-main')).toBe(true);
      advance(world);expect(world.won).toBe(true);
    }finally{world.destroy();}
  });
  it('does not repeat the teaching after a retry, but still charges before releasing',()=>{
    const world=setup();advance(world);
    const fresh=new PhysicsWorld(realityBreakdown,world.seenTutorials);
    try{
      for(const text of realityBreakdown.instructions.exampleMessages)apply(fresh,text);
      advance(fresh);expect(fresh.tutorialId).toBeNull();expect(fresh.won).toBe(true);
      fresh.seenTutorials.clear();expect(fresh.seenTutorials.size).toBe(0);
    }finally{world.destroy();fresh.destroy();}
  });
});
