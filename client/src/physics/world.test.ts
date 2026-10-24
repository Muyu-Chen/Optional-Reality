import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { EXIT, PhysicsWorld, ROUND_TICKS } from './world';

describe('zero-gravity lab', () => {
  it('starts and runs without gravity until a rule is explicitly applied', () => {
    const world = new PhysicsWorld();
    try {
      expect(world.gravity).toBe(0);
      expect(world.started).toBe(false);
      world.start();
      for (let i = 0; i < 240; i++) world.step();
      expect(world.tick).toBe(240);
      expect(world.ball.position.x).toBeCloseTo(165, 8);
      expect(world.ball.position.y).toBeCloseTo(135, 8);
    } finally { world.destroy(); }
  });
  it('maps a = 1 m/s² to the simulation scale and preserves momentum after stop gravity', () => {
    const world = new PhysicsWorld();
    try {
      world.start(); world.setGravity(1);
      for (let i = 0; i < 30; i++) world.step();
      expect(world.ball.position.y).toBeCloseTo(137.58, 1);
      const y = world.ball.position.y;
      const velocity = world.ball.velocity.y;
      world.setGravity(0);
      for (let i = 0; i < 30; i++) world.step();
      expect(world.ball.position.y - y).toBeCloseTo(5, 1);
      expect(world.ball.velocity.y).toBeCloseTo(velocity, 8);
      world.pause(); const tick = world.tick; world.step(); expect(world.tick).toBe(tick);
    } finally { world.destroy(); }
  });
  it('can complete the ramp experiment when gravity is stopped after leaving the track', () => {
    const world = new PhysicsWorld();
    try {
      world.start(); world.setGravity(1);
      let switched = false;
      for (let i = 0; i < 3600 && !world.won; i++) {
        if (!switched && world.ball.position.x >= 610) { world.setGravity(0); switched = true; }
        world.step();
      }
      expect(switched, JSON.stringify(world.snapshot())).toBe(true);
      expect(world.won).toBe(true);
    } finally { world.destroy(); }
  });
  it.each([
    ['left edge', EXIT.x - 16, EXIT.y + 10],
    ['top edge', EXIT.x + 20, EXIT.y - 16],
    ['bottom edge', EXIT.x + 20, EXIT.y + EXIT.height + 16],
    ['corner', EXIT.x - 11, EXIT.y - 11],
  ])('completes when the ball touches the %s without its centre entering the exit', (_, x, y) => {
    const world = new PhysicsWorld();
    try {
      Matter.Body.setPosition(world.ball, { x, y });
      world.start(); world.step();
      expect(world.won).toBe(true);
      expect(world.running).toBe(false);
    } finally { world.destroy(); }
  });
  it('does not complete when the ball passes just outside the exit', () => {
    const world = new PhysicsWorld();
    try {
      Matter.Body.setPosition(world.ball, { x: EXIT.x - 18, y: EXIT.y + 10 });
      world.start(); world.step();
      expect(world.won).toBe(false);
    } finally { world.destroy(); }
  });
  it('ends after 30 simulated seconds, excluding time before starting and while paused', () => {
    const world = new PhysicsWorld();
    try {
      for (let i = 0; i < 120; i++) world.step();
      expect(world.tick).toBe(0);
      world.start();
      for (let i = 0; i < ROUND_TICKS - 1; i++) world.step();
      expect(world.timedOut).toBe(false);
      world.pause();
      for (let i = 0; i < 120; i++) world.step();
      expect(world.tick).toBe(ROUND_TICKS - 1);
      world.start(); world.step();
      expect(world.tick).toBe(ROUND_TICKS);
      expect(world.timedOut).toBe(true);
      expect(world.running).toBe(false);
      world.start(); world.step();
      expect(world.running).toBe(false);
      expect(world.tick).toBe(ROUND_TICKS);
    } finally { world.destroy(); }
  });
  it('counts a touch on the last tick as a win', () => {
    const world = new PhysicsWorld();
    try {
      world.tick = ROUND_TICKS - 1;
      Matter.Body.setPosition(world.ball, { x: EXIT.x - 16, y: EXIT.y + 10 });
      world.start(); world.step();
      expect(world.won).toBe(true);
      expect(world.timedOut).toBe(false);
    } finally { world.destroy(); }
  });
});
