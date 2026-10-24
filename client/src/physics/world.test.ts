import { describe, expect, it } from 'vitest';
import { PhysicsWorld } from './world';

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
});
