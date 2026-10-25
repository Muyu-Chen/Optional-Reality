import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { PhysicsWorld } from './world';
import { catchCup } from '../levels/catch-cup';
import type { Operation } from '../../../shared/rules';

function firstRebound(target: string, restitution: number) {
  const world = new PhysicsWorld(catchCup);
  let touched = false;
  Matter.Events.on(world.engine, 'collisionStart', event => {
    if (event.pairs.some(pair => [pair.bodyA.label, pair.bodyB.label].includes('launch-pad'))) touched = true;
  });
  try {
    const operation: Operation = { type: 'set_property', target, property: 'restitution', value: restitution };
    world.applyMessages([{ text: 'material probe', operations: [operation] }]); world.start();
    while (!touched && world.running) world.step();
    expect(touched).toBe(true);
    const bodies = world.engine.world.bodies.filter(body => body.label === 'launch-pad');
    return { velocity: Matter.Body.getVelocity(world.ball), x: world.ball.position.x, y: world.ball.position.y,
      restitution: bodies.map(body => body.restitution), rules: world.rules };
  } finally { world.destroy(); }
}

describe('Catch Tutorial effective materials', () => {
  it('applies a general 1.5 command to the launch pad and cup while preserving walls', () => {
    const result = firstRebound('world', 1.5);
    expect(result.restitution.every(value => value === 1.5)).toBe(true);
    expect(result.rules.values.world.restitution).toBe(1.5);
    expect(result.rules.values['cup-base'].restitution).toBe(1.5);
    expect(result.rules.values['cup-left'].restitution).toBe(0);
    expect(result.velocity.y).toBeLessThan(firstRebound('world', 1).velocity.y * 1.4);
    expect(result.velocity).toEqual(firstRebound('launch-pad', 1.5).velocity);
  });
  it('really rebounds more strongly with launch-pad 1.5 than launch-pad 1', () => {
    const elastic = firstRebound('launch-pad', 1), stronger = firstRebound('launch-pad', 1.5);
    expect(stronger.restitution.every(value => value === 1.5)).toBe(true);
    expect(elastic.velocity.y).toBeLessThan(0);
    expect(stronger.velocity.y).toBeLessThan(elastic.velocity.y * 1.4);
    expect(stronger.rules.values['cup-base'].restitution).toBe(1.05);
  });
});
