import { describe, expect, it } from 'vitest';
import { multiBounce } from '../levels/multi-bounce';
import { frictionRunway } from '../levels/friction-runway';
import { catchCup } from '../levels/catch-cup';
import { ruleContext } from '../levels/rules';
import { messageOperations, prepareMessage } from '../domain/queue';
import { PhysicsWorld } from './world';

function send(world: PhysicsWorld,text: string) {
  const prepared=prepareMessage(text,text,ruleContext(world.level),world.rules);
  expect(prepared.status,prepared.error).toBe('ready');
  world.applyMessages([{text,operations:messageOperations(prepared)}]);world.start();
}
function advance(world: PhysicsWorld,ticks=3600) { for(let i=0;i<ticks&&world.running;i++)world.step(); }

describe('multiple rebounds', () => {
  it.each([280,360,480,560])('allows a wide second-message timing window at tick %s', tick => {
    const world=new PhysicsWorld(multiBounce);
    try {
      send(world,'Set surface bounce to 0.9');advance(world,tick);
      expect(world.ball.position.y).toBeLessThan(400);expect(world.won).toBe(false);
      const velocity={...world.ball.velocity};send(world,'Set surface bounce to 0.5');
      expect(world.ball.velocity).toEqual(velocity);advance(world);
      expect(world.won,JSON.stringify(world.snapshot())).toBe(true);
    } finally {world.destroy();}
  });
  it.each([.1,.9])('does not win by leaving bounce at %s throughout', value => {
    const world=new PhysicsWorld(multiBounce);
    try {send(world,`Set surface bounce to ${value}`);advance(world);expect(world.won).toBe(false);expect(world.timedOut).toBe(true);}finally{world.destroy();}
  });
  it('physically rebounds twice before reaching the exit', () => {
    const world=new PhysicsWorld(multiBounce);const rebounds:number[]=[];
    try {
      send(world,'Set surface bounce to 0.9');
      while(world.running) {
        if(world.tick===360)send(world,'Set surface bounce to 0.5');
        const vy=world.ball.velocity.y;world.step();
        if(vy>.1&&world.ball.velocity.y<-.1)rebounds.push(world.ball.position.x);
      }
      expect(world.won).toBe(true);expect(rebounds).toHaveLength(2);
      expect(rebounds[0]).toBeLessThan(385);expect(rebounds[1]).toBeGreaterThan(415);
    } finally {world.destroy();}
  });
});

describe('friction runway', () => {
  it.each([420,450,500,550,600])('can brake throughout a forgiving green-bay window at x=%s', x => {
    const world=new PhysicsWorld(frictionRunway);
    try {
      send(world,'Set surface friction to 0');
      while(world.running&&world.ball.position.x<x)world.step();
      expect(world.won).toBe(false);expect(world.goal.progress).toBe(0);
      send(world,'Set surface friction to 0.3');advance(world);
      expect(world.won,JSON.stringify(world.snapshot())).toBe(true);expect(world.goal.progress).toBe(1);
      expect(world.ball.angle).toBe(0);
    } finally {world.destroy();}
  });
  it.each([.1,.2,.3,.5])('accepts different braking strengths: %s', coefficient => {
    const world=new PhysicsWorld(frictionRunway);
    try {
      send(world,'Set surface friction to 0');advance(world,270);
      send(world,`Set surface friction to ${coefficient}`);advance(world);expect(world.won).toBe(true);
    } finally {world.destroy();}
  });
  it.each([250,665])('cannot park by braking outside the target at x=%s', x => {
    const world=new PhysicsWorld(frictionRunway);
    try {
      send(world,'Set surface friction to 0');while(world.running&&world.ball.position.x<x)world.step();
      send(world,'Set surface friction to 0.3');advance(world);expect(world.won).toBe(false);expect(world.timedOut).toBe(true);
    } finally {world.destroy();}
  });
  it('slides through the target and falls if friction is never added', () => {
    const world=new PhysicsWorld(frictionRunway);
    try {send(world,'Set surface friction to 0');advance(world);expect(world.won).toBe(false);expect(world.fell).toBe(true);}finally{world.destroy();}
  });
});

describe('catching cup', () => {
  it.each([1.05,1.075,1.1,1.125,1.15])('captures a range of launch strengths: %s', strength => {
    const world=new PhysicsWorld(catchCup);
    try {
      send(world,`Set launch pad bounce to ${strength}`);advance(world,400);
      send(world,'Set cup bounce to 0');advance(world);
      expect(world.won,JSON.stringify(world.snapshot())).toBe(true);expect(world.goal.progress).toBe(1);
      expect(world.rules.values['launch-pad'].restitution).toBe(strength);
    } finally {world.destroy();}
  });
  it.each([250,360,480,600])('can soften the cup during the flight at tick %s', tick => {
    const world=new PhysicsWorld(catchCup);
    try {
      send(world,'Set launch pad bounce to 1.1');advance(world,tick);
      send(world,'Set cup bounce to 0');advance(world);expect(world.won).toBe(true);
    } finally {world.destroy();}
  });
  it('fails to stay in a cup left bouncy, then can retry with independent rules', () => {
    const world=new PhysicsWorld(catchCup);
    try {
      send(world,'Set launch pad bounce to 1.1');advance(world);
      expect(world.won).toBe(false);expect(world.fell).toBe(true);
      const fresh=new PhysicsWorld(catchCup);
      try {
        expect(fresh.goal.progress).toBe(0);expect(fresh.rules.values['launch-pad'].restitution).toBe(.1);
        send(fresh,'Set launch pad bounce to 1.1');send(fresh,'Set cup bounce to 0');advance(fresh);
        expect(fresh.won).toBe(true);
      } finally {fresh.destroy();}
    } finally {world.destroy();}
  });
});
