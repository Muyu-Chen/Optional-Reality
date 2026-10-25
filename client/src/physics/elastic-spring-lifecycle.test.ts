import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { oneMoreTurn } from '../levels/one-more-turn';
import { PhysicsWorld } from './world';

function fallToContact(world: PhysicsWorld) {
  world.setGravity(1);
  world.start();
  for (let tick = 0; tick < 600; tick++) {
    world.step();
    if (world.devices.springs.get('fixed-spring')?.phase === 'charging') return;
  }
  throw new Error('The falling ball did not contact its spring.');
}

function springSnapshot(world: PhysicsWorld) {
  return {
    position: { ...world.ball.position }, velocity: { ...Matter.Body.getVelocity(world.ball) },
    force: { ...world.ball.force }, spring: { ...world.devices.springs.get('fixed-spring')! },
    tick: world.tick, stars: world.stars.snapshot(), fired: [...world.devices.firedSprings],
  };
}

describe('passive spring lifecycle and rule changes', () => {
  it('freezes compression, velocity, elastic force and events while the game is paused', () => {
    const world = new PhysicsWorld(oneMoreTurn);
    const reference = new PhysicsWorld(oneMoreTurn);
    try {
      fallToContact(world); fallToContact(reference);
      world.pause();
      const paused = springSnapshot(world);
      for (let tick = 0; tick < 500; tick++) world.step();
      expect(springSnapshot(world)).toEqual(paused);
      world.start();
      world.step(); reference.step();
      expect(springSnapshot(world)).toEqual(springSnapshot(reference));
    } finally { world.destroy(); reference.destroy(); }
  });

  it('retries a compressed spring from the same initial state and reproduces its natural motion', () => {
    const world = new PhysicsWorld(oneMoreTurn);
    let retry: PhysicsWorld | undefined;
    try {
      fallToContact(world);
      const reference = springSnapshot(world);
      const contactTick = world.tick;
      for (let tick = 0; tick < 10; tick++) world.step();
      retry = world.retryWithRules();
      expect(retry.ball.position.x).toBe(oneMoreTurn.ball.position[0]);
      expect(retry.ball.position.y).toBe(oneMoreTurn.ball.position[1]);
      expect(Matter.Body.getVelocity(retry.ball)).toEqual({ x: 0, y: 0 });
      expect(retry.tick).toBe(0);
      expect(retry.devices.firedSprings.size).toBe(0);
      expect(retry.devices.springs.get('fixed-spring')?.phase).toBe('idle');
      retry.start();
      for (let tick = 0; tick < contactTick; tick++) retry.step();
      expect(springSnapshot(retry)).toEqual(reference);
    } finally { world.destroy(); retry?.destroy(); }
  });

  it.each(['falling', 'compressing'] as const)('reverses acceleration during %s without resetting velocity or position', phase => {
    const world = new PhysicsWorld(oneMoreTurn);
    try {
      if (phase === 'compressing') fallToContact(world);
      else { world.setGravity(1); world.start(); for (let tick = 0; tick < 60; tick++) world.step(); }
      world.pause();
      const before = springSnapshot(world);
      world.applyMessages([{ text: 'reverse gravity', operations: [{ type: 'reverse_gravity' }] }]);
      expect(world.rules.acceleration.y).toBe(-1);
      expect(world.engine.gravity.y).toBe(-1);
      expect(springSnapshot(world)).toEqual(before);
      world.start(); world.step();
      expect(Matter.Body.getVelocity(world.ball).y).toBeLessThan(before.velocity.y);
      expect(Math.abs(world.ball.position.y - before.position.y)).toBeLessThan(2);
    } finally { world.destroy(); }
  });

  it('turns off an editable elastic spring during contact without releasing a launch impulse', () => {
    const level = { ...oneMoreTurn, id: 'elastic-power-fixture', number: 3, editableDevices: ['fixed-spring'] };
    const world = new PhysicsWorld(level);
    try {
      fallToContact(world);
      const before = springSnapshot(world);
      world.applyMessages([{ text: 'spring power zero', operations: [{ type: 'set_property', target: 'fixed-spring', property: 'spring_power', value: 0 }] }]);
      world.devices.beforeStep(world.rules, 1 / 120);
      expect(world.ball.position).toEqual(before.position);
      expect(Matter.Body.getVelocity(world.ball)).toEqual(before.velocity);
      expect(world.ball.force).toEqual({ x: 0, y: 0 });
      expect(world.devices.springs.get('fixed-spring')?.phase).toBe('idle');
      expect(world.devices.firedSprings.size).toBe(0);
      expect(world.devices.takeEvents()).toEqual([]);
      world.step();
      expect(Matter.Body.getVelocity(world.ball).y).toBeGreaterThan(before.velocity.y);
    } finally { world.destroy(); }
  });
});
