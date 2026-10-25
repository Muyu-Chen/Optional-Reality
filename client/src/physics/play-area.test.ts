import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { levels } from '../levels/catalog';
import { bounce } from '../levels/bounce';
import { frictionRunway } from '../levels/friction-runway';
import { catchCup } from '../levels/catch-cup';
import { actorBounds, outsidePlayArea } from './play-area';
import { PhysicsWorld } from './world';

describe('open play area', () => {
  it.each(levels)('$id has no implicit containment walls and keeps its visible surfaces', level => {
    const world = new PhysicsWorld(level);
    try {
      expect(world.engine.world.bodies.some(body => body.label.startsWith('boundary-'))).toBe(false);
      for (const track of level.tracks) expect(world.engine.world.bodies.some(body => body.label === track.id)).toBe(true);
    } finally { world.destroy(); }
  });

  it.each([
    ['left', -16, 300, -1, 0], ['right', 816, 300, 1, 0],
    ['top', 300, -16, 0, -1], ['bottom', 300, 526, 0, 1],
  ] as const)('allows partial visibility at the %s edge, then ends immediately after full departure', (edge, x, y, dx, dy) => {
    const world = new PhysicsWorld(bounce);
    try {
      // Exact contact with an edge and a sliver still on screen are both safe.
      Matter.Body.setPosition(world.ball, { x: x-dx*.1, y: y-dy*.1 });
      expect(outsidePlayArea(world.ball, bounce)).toBeNull();
      Matter.Body.setPosition(world.ball, { x, y });
      expect(outsidePlayArea(world.ball, bounce)).toBeNull();
      world.setGravity(0);
      Matter.Body.setVelocity(world.ball, { x: dx, y: dy });
      world.start(); world.step();
      expect(world.outOfBounds).toBe(edge);
      expect(world.fell).toBe(true); expect(world.timedOut).toBe(true);
      expect(world.won).toBe(false); expect(world.running).toBe(false);
      // No bounce, freeze against a wall, or restart after losing.
      expect(world.ball.velocity.x*dx+world.ball.velocity.y*dy).toBeGreaterThan(0);
      const terminal = world.snapshot();
      world.start(); for (let i=0; i<120; i++) world.step();
      expect(world.snapshot()).toEqual(terminal);
      expect(() => world.applyMessages([{ text:'late', operations:[{type:'set_gravity',acceleration:0}] }])).toThrow();
    } finally { world.destroy(); }
  });

  it('does not use the velocity-expanded Matter bounds to delay failure', () => {
    const world = new PhysicsWorld(bounce);
    try {
      Matter.Body.setPosition(world.ball, { x:817, y:300 });
      world.ball.bounds.min.x = 750; // Cached motion margin still intersects the room.
      expect(outsidePlayArea(world.ball, bounce)).toBe('right');
    } finally { world.destroy(); }
  });

  it('uses the rotated slider vertices, rather than a circle or its centre', () => {
    const world = new PhysicsWorld(frictionRunway);
    try {
      Matter.Body.setAngle(world.ball, Math.PI/4);
      Matter.Body.setPosition(world.ball, { x:820, y:200 });
      expect(actorBounds(world.ball, frictionRunway).min.x).toBeLessThan(800);
      expect(outsidePlayArea(world.ball, frictionRunway)).toBeNull();
      Matter.Body.setPosition(world.ball, { x:825, y:200 });
      world.ball.bounds.min.x=790;
      expect(outsidePlayArea(world.ball, frictionRunway)).toBe('right');
    } finally { world.destroy(); }
  });

  it('leaves the right edge naturally instead of being caught by an invisible wall', () => {
    const world = new PhysicsWorld(bounce);
    try {
      world.setGravity(0);
      Matter.Body.setPosition(world.ball, {x:790,y:350});
      Matter.Body.setVelocity(world.ball, {x:2,y:0});
      world.start();
      while(world.running) world.step();
      expect(world.outOfBounds).toBe('right');
      expect(world.ball.position.x).toBeGreaterThan(816);
      expect(world.tick).toBeLessThan(60);
    } finally { world.destroy(); }
  });

  it('does not turn a full collection into a win if the exit was missed, including the final tick', () => {
    const world = new PhysicsWorld(bounce);
    try {
      for (const star of bounce.stars || []) world.stars.collected.add(star.id);
      world.setGravity(0);
      Matter.Body.setPosition(world.ball, {x:817,y:350});
      world.tick=world.limitTicks-1; world.start();world.step();
      expect(world.outOfBounds).toBe('right');expect(world.won).toBe(false);
      expect(world.stars.fullScore).toBe(true);
      expect(world.snapshot()).toMatchObject({running:false,timedOut:true,fell:true});
    } finally { world.destroy(); }
  });

  it('gives valid exit contact priority over timeout at an open boundary', () => {
    const level = {...bounce, exit:{...bounce.exit,x:780,y:200,width:20,height:60}};
    const world = new PhysicsWorld(level);
    try {
      world.setGravity(0);Matter.Body.setPosition(world.ball,{x:815,y:230});
      world.tick=world.limitTicks-1;world.start();world.step();
      expect(world.won).toBe(true);expect(world.outOfBounds).toBeNull();expect(world.timedOut).toBe(false);
    } finally { world.destroy(); }
  });

  it('freezes boundary evaluation while paused and resets the cause for a fresh attempt', () => {
    const world = new PhysicsWorld(bounce);
    try {
      Matter.Body.setPosition(world.ball, {x:817,y:300});
      world.step();expect(world.tick).toBe(0);expect(world.outOfBounds).toBeNull();
      world.start();world.step();expect(world.outOfBounds).toBe('right');
      const retry=world.retryWithRules();
      try {expect(retry.snapshot()).toMatchObject({outOfBounds:null,fell:false,timedOut:false,started:false,tick:0});}
      finally {retry.destroy();}
    } finally {world.destroy();}
  });

  it('keeps the cup walls as real collision geometry', () => {
    const world=new PhysicsWorld(catchCup);
    try {
      const walls=catchCup.tracks.filter(track=>track.preset);
      expect(walls.length).toBeGreaterThan(0);
      for(const wall of walls) expect(world.engine.world.bodies.some(body=>body.label===wall.id)).toBe(true);
    } finally {world.destroy();}
  });
});
