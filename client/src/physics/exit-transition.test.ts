import { afterEach, describe, expect, it } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import type { LevelDefinition } from '../levels/types';
import { PhysicsWorld } from './world';
import { EXIT_TRANSITION_SECONDS, ExitTransition } from './exit-transition';

const worlds: PhysicsWorld[] = [];
afterEach(() => worlds.splice(0).forEach(world => world.destroy()));
function completed(settle = false) {
  const level: LevelDefinition = {
    ...gravityLab, tracks: [], initialAcceleration: [0, 0],
    ball: { ...gravityLab.ball, position: [400, 200], velocity: [0, 0] },
    exit: { id: 'test-exit', label: 'EXIT', x: 380, y: 175, width: 100, height: 60,
      ...(settle ? { condition: { kind: 'settle' as const, seconds: 1 / 60, maxSpeed: .01 } } : {}) },
  };
  const world = new PhysicsWorld(level);worlds.push(world);world.start();
  for (let tick = 0; tick < 4; tick++) world.step();
  expect(world.won).toBe(true);
  return { world, transition: new ExitTransition(level) };
}
function advance(transition: ExitTransition, seconds: number) {
  for (let elapsed = 0; elapsed + 1e-9 < seconds; elapsed += .01) transition.advance(.01);
}

describe('exit presentation without physical side effects', () => {
  it.each([false, true])('animates a real completed goal (settling: %s) then finishes once', settle => {
    const { world, transition } = completed(settle);
    const result = world.snapshot(), position = { ...world.ball.position }, velocity = { ...world.ball.velocity };
    transition.capture(world);
    expect(transition.phase).toBe('absorbing');
    expect(transition.visual!.actor).toMatchObject({ ...position, scale: 1, opacity: 1 });
    advance(transition, .5);
    expect(transition.phase).toBe('absorbing');
    expect(transition.visual!.actor.scale).toBeLessThan(1);
    expect(transition.visual!.actor.x).toBeGreaterThan(position.x);
    advance(transition, EXIT_TRANSITION_SECONDS - .5);
    expect(transition.phase).toBe('complete');
    expect(transition.visual!.actor).toMatchObject({ x: 430, y: 205, scale: 0, opacity: 0 });
    for (let tick = 0; tick < 240; tick++) world.step();
    expect(world.snapshot()).toEqual(result);
    expect(world.ball.position).toEqual(position);expect(world.ball.velocity).toEqual(velocity);
    transition.capture(world);transition.advance(1);
    expect(transition.phase).toBe('complete');
  });

  it('does not start for a paused or failed world', () => {
    const world = new PhysicsWorld(gravityLab);worlds.push(world);
    const transition = new ExitTransition(gravityLab);
    transition.capture(world);transition.advance(1);
    expect(transition.visual).toBeNull();
    world.timedOut = true;transition.capture(world);
    expect(transition.phase).toBe('idle');
  });

  it('does not skip the absorption after a background-sized frame', () => {
    const { world, transition } = completed();transition.capture(world);
    transition.advance(100);
    expect(transition.phase).toBe('absorbing');
    expect(transition.visual!.progress).toBeCloseTo(.05 / EXIT_TRANSITION_SECONDS);
    transition.advance(-1);
    expect(transition.visual!.progress).toBeCloseTo(.05 / EXIT_TRANSITION_SECONDS);
  });

  it('cancels the old visual pose when a new attempt resets the controller', () => {
    const { world, transition } = completed();transition.capture(world);advance(transition, .4);
    transition.reset();transition.advance(10);
    expect(transition.phase).toBe('idle');expect(transition.visual).toBeNull();
    const fresh = new PhysicsWorld(gravityLab);worlds.push(fresh);transition.capture(fresh);
    expect(transition.phase).toBe('idle');
  });

  it('completes immediately for reduced motion, including preference changes during absorption', () => {
    const { world, transition } = completed();transition.capture(world, true);
    expect(transition.phase).toBe('complete');expect(transition.visual!.actor.scale).toBe(0);
    transition.reset();transition.capture(world);transition.advance(.05, true);
    expect(transition.phase).toBe('complete');
  });
});
