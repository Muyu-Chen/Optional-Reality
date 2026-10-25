import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { findLevel } from '../levels/catalog';
import { ruleContext } from '../levels/rules';
import { messageOperations, prepareMessage } from '../domain/queue';
import { fullScoreSolution } from '../test/level-solutions';
import { PhysicsWorld } from './world';

function send(world: PhysicsWorld, text: string) {
  const message = prepareMessage(text, text, ruleContext(world.level), world.rules);
  expect(message.status, message.error || text).toBe('ready');
  world.applyMessages([{ text, operations: messageOperations(message) }]);
}
function play(id: string, firstX?: number, replacement?: string, skipLater = false) {
  const world = new PhysicsWorld(findLevel(id)!);
  const route = fullScoreSolution(world.level), steps = route.transitions || [];
  const impacts = new Set<string>();let next = 0;
  Matter.Events.on(world.engine, 'collisionStart', event => {
    for (const pair of event.pairs) { impacts.add(pair.bodyA.label);impacts.add(pair.bodyB.label); }
  });
  try {
    for (const text of replacement ? [replacement] : route.initial) send(world, text);
    world.start();
    while (world.running) {
      const step = steps[next];
      if (!skipLater && step && (next === 0 && firstX !== undefined ? world.ball.position.x >= firstX : step.when(world))) {
        send(world, step.message);next++;
      }
      world.step();
    }
    return { won: world.won, full: world.stars.fullScore, overtime: world.overtime, impacts: [...impacts], acceleration: world.rules.acceleration };
  } finally { world.destroy(); }
}

describe('momentum and multi-impact expansion', () => {
  it.each([320, 330, 340, 350, 360])('threads the gap with a forgiving reversal at x%s', x => {
    expect(play('thread-the-gap', x)).toMatchObject({ won: true, full: true, overtime: false });
  });
  it.each([280, 290, 300, 310, 320])('brakes over the chimney after starting at x%s', x => {
    expect(play('down-the-chimney', x)).toMatchObject({ won: true, full: true, overtime: false });
  });
  it.each([420, 435, 450, 465, 480])('draws a full-score hook after braking at x%s', x => {
    expect(play('hook-turn', x)).toMatchObject({ won: true, full: true, overtime: false });
  });
  it.each([300, 310, 320, 330, 340])('can coast across the gap after removing the pull at x%s', x => {
    expect(play('mind-the-gap', x)).toMatchObject({ won: true, full: true, overtime: false });
  });
  it.each(['thread-the-gap', 'down-the-chimney', 'hook-turn', 'mind-the-gap'])('%s cannot coast to completion without its later rule changes', id => {
    expect(play(id, undefined, undefined, true).won).toBe(false);
  });
  it.each([0.9, 1, 1.1])('uses both banks without gravity at restitution %s', value => {
    const result = play('double-bank', undefined, `Set surface bounce to ${value}`);
    expect(result).toMatchObject({ won: true, full: true, overtime: false, acceleration: { x: 0, y: 0 } });
    expect(result.impacts).toEqual(expect.arrayContaining(['lower-bank', 'upper-bank']));
  });
  it('uses the roof collision before parking on the separate receiver', () => {
    const result = play('low-roof');
    expect(result).toMatchObject({ won: true, full: true, overtime: false });
    expect(result.impacts).toEqual(expect.arrayContaining(['launch-pad', 'roof', 'landing-floor']));
  });
  it('cannot reach the roof star when the launch pad is soft', () => {
    expect(play('low-roof', undefined, 'Set surface bounce to 0 and surface friction to 0.3').full).toBe(false);
  });
  it('removes only horizontal acceleration at the chimney, preserving falling motion', () => {
    const world = new PhysicsWorld(findLevel('down-the-chimney')!);
    try {
      send(world, 'acceleration leftward 0.5 and acceleration downward 0.4');
      world.start();for (let i = 0; i < 60; i++) world.step();
      const velocity = {...world.ball.velocity};
      send(world, 'acceleration rightward 0');
      expect(world.rules.acceleration).toEqual({ x: 0, y: 0.4 });
      expect(world.ball.velocity).toEqual(velocity);
    } finally { world.destroy(); }
  });
});
