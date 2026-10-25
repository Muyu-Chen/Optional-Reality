import Matter from 'matter-js';
import {describe,expect,it} from 'vitest';
import {PhysicsWorld} from './world';
import {frictionRunway} from '../levels/friction-runway';
import {mindTheGap} from '../levels/mind-the-gap';
import {fullScoreSolution} from '../test/level-solutions';
import {parseCommands} from '../../../shared/commands';
import {ruleContext} from '../levels/rules';

const level={...frictionRunway,viewport:{...frictionRunway.viewport,width:3000},
  ball:{...frictionRunway.ball,position:[1000,377] as const},stars:undefined,
  tracks:[{...frictionRunway.tracks[0],points:[[40,400],[2950,400]] as const}],
  exit:{...frictionRunway.exit,x:2800}};
const speed=(world:PhysicsWorld)=>world.ball.velocity.x*60/world.level.viewport.pixelsPerMetre;
function friction(world:PhysicsWorld,value:number) {world.applyMessages([{text:'friction',operations:[{type:'set_property',target:'world',property:'friction',value}]}]);}
function step(world:PhysicsWorld,ticks:number) {for(let i=0;i<ticks;i++)world.step();}

describe('physical sliding friction',()=>{
  it.each([[.1,2],[.3,2],[.3,4],[.6,1]])('follows μN continuously for μ=%s and acceleration=%s', (coefficient,gravity)=>{
    const world=new PhysicsWorld({...level,initialAcceleration:[0,gravity]});
    try {
      friction(world,coefficient);expect(speed(world)).toBeCloseTo(2,8);world.start();
      step(world,12);expect(speed(world)).toBeCloseTo(2-coefficient*gravity*.1,4);
      step(world,108);expect(speed(world)).toBeCloseTo(2-coefficient*gravity,4);
    }finally{world.destroy();}
  });
  it('takes about 3.3 seconds to stop with μ=0.3, stays still and never reverses',()=>{
    const world=new PhysicsWorld(level);
    try {
      friction(world,.3);world.start();step(world,120);expect(speed(world)).toBeCloseTo(1.4,5);
      step(world,240);expect(speed(world)).toBeCloseTo(.2,5);
      step(world,40);expect(speed(world)).toBeCloseTo(0,8);
      expect(Math.abs(world.ball.position.x-1000-2*2/(2*.3*2)*80)).toBeLessThan(1);
      const x=world.ball.position.x;step(world,240);expect(world.ball.position.x).toBeCloseTo(x,8);
    }finally{world.destroy();}
  });
  it.each([0,-2])('does not brake without supporting normal load, acceleration=%s',gravity=>{
    const world=new PhysicsWorld({...level,initialAcceleration:[0,gravity]});
    try{friction(world,1);world.start();step(world,120);expect(speed(world)).toBeCloseTo(2,6);}finally{world.destroy();}
  });
  it('does not brake in the air, and changing the rule never changes velocity immediately',()=>{
    const world=new PhysicsWorld({...level,ball:{...level.ball,position:[1000,100]}});
    try {
      const before={...world.ball.velocity};friction(world,1);expect(world.ball.velocity).toEqual(before);
      world.start();step(world,120);expect(speed(world)).toBeCloseTo(2,6);
    }finally{world.destroy();}
  });
  it.each([.25,4])('is independent of block mass %s',mass=>{
    const world=new PhysicsWorld(level);
    try{Matter.Body.setMass(world.ball,mass);friction(world,.3);world.start();step(world,120);expect(speed(world)).toBeCloseTo(1.4,5);}finally{world.destroy();}
  });
  it('counts a segmented track seam once and preserves deterministic comparison replay',()=>{
    const world=new PhysicsWorld({...level,tracks:[{...level.tracks[0],points:[[40,400],[1000,400],[2950,400]]}]});
    try {
      friction(world,.3);world.start();step(world,120);expect(speed(world)).toBeCloseTo(1.4,5);
      world.applyMessages([{text:'reverse',operations:[{type:'reverse_gravity'}]}]);
      const fork=world.forkBeforeLastRuleChange();
      try{expect(fork).not.toBeNull();expect(fork!.ball.position).toEqual(world.ball.position);expect(fork!.ball.velocity).toEqual(world.ball.velocity);}
      finally{fork?.destroy();}
    }finally{world.destroy();}
  });
  it('keeps the existing gap level solvable by preparing the landing material before contact',()=>{
    const world=new PhysicsWorld(mindTheGap),route=fullScoreSolution(mindTheGap);let next=0;
    const send=(text:string)=>world.applyMessages([{text,operations:parseCommands(text,ruleContext(mindTheGap)).operations!}]);
    try {
      for(const text of route.initial)send(text);world.start();
      while(world.running){const action=route.transitions?.[next];if(action?.when(world)){send(action.message);next++;}world.step();}
      expect(world.won).toBe(true);expect(world.stars.fullScore).toBe(true);expect(world.overtime).toBe(false);
    }finally{world.destroy();}
  });
});
