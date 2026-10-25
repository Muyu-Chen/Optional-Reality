import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { prepareMessage, messageOperations } from '../domain/queue';
import { findLevel } from '../levels/catalog';
import { ruleContext } from '../levels/rules';
import { fullScoreSolution } from '../test/level-solutions';
import { PhysicsWorld } from './world';

function send(world: PhysicsWorld, text: string) {
  const message = prepareMessage(text, text, ruleContext(world.level), world.rules);
  expect(message.status, message.error || text).toBe('ready');
  world.applyMessages([{ text, operations: messageOperations(message) }]);
}

function play(id: string, when?: (world: PhysicsWorld) => boolean, message?: string) {
  const world = new PhysicsWorld(findLevel(id)!);
  const route = fullScoreSolution(world.level);
  let sent = false;
  try {
    for (const text of route.initial) send(world, text);
    world.start();
    while (world.running) {
      if (!sent && when?.(world) && message) { send(world, message); sent = true; }
      world.step();
    }
    return { won: world.won, full: world.stars.fullScore, stars: [...world.stars.collected], overtime: world.overtime, out: world.outOfBounds };
  } finally { world.destroy(); }
}

describe('new motion and collision puzzles', () => {
  it.each([460, 500, 540, 580, 600])('can turn back with all stars after braking at x=%s', x => {
    expect(play('bring-it-back', w => w.ball.position.x >= x, 'acceleration leftward 1'))
      .toMatchObject({ won: true, full: true, overtime: false });
  });

  it('permits an early ordinary return but loses the far stars', () => {
    expect(play('bring-it-back', w => w.ball.position.x >= 250, 'acceleration leftward 1'))
      .toMatchObject({ won: true, full: false, overtime: false });
  });

  it.each([280, 290, 300, 310])('can clear the wall and collect all stars when reversing at x=%s', x => {
    expect(play('over-the-wall', w => w.ball.position.x >= x, 'reverse gravity'))
      .toMatchObject({ won: true, full: true, overtime: false });
  });

  it.each([185, 190, 195, 200])('can steer around the shelf when switching at y=%s', y => {
    expect(play('side-door', w => w.ball.position.y >= y, 'acceleration leftward 0.15'))
      .toMatchObject({ won: true, full: true, overtime: false });
  });

  it.each(['bring-it-back', 'over-the-wall', 'side-door', 'return-to-dock', 'one-last-bounce'])('%s needs its later rule for the recommended full-score route', id => {
    const result = play(id);
    expect(result.won).toBe(false);
  });

  it.each([0.8, 0.9, 1, 1.1])('uses a real angled rebound for a full-score bank shot at bounce %s', value => {
    const world = new PhysicsWorld(findLevel('bank-shot')!);
    let impacts = 0;
    Matter.Events.on(world.engine, 'collisionStart', event => {
      impacts += event.pairs.filter(pair => pair.bodyA.label === 'bank' || pair.bodyB.label === 'bank').length;
    });
    try {
      send(world, `Set surface bounce to ${value}`); world.start();
      while (world.running) world.step();
      expect(impacts).toBeGreaterThan(0);
      expect(world.won).toBe(true); expect(world.stars.fullScore).toBe(true);
      expect(world.rules.acceleration).toEqual({ x: 0, y: 0 });
    } finally { world.destroy(); }
  });

  it('can pass the bank shot with a weaker bounce while missing a star', () => {
    const world = new PhysicsWorld(findLevel('bank-shot')!);
    try {
      send(world, 'Set surface bounce to 0.5'); world.start();
      while (world.running) world.step();
      expect(world.won).toBe(true); expect(world.stars.fullScore).toBe(false);
    } finally { world.destroy(); }
  });

  it.each([400, 440, 480, 520, 560])('can brake before the dock and coast into it after the wall rebound at returning x=%s', x => {
    expect(play('return-to-dock', w => w.ball.velocity.x < 0 && w.ball.position.x <= x, 'Set surface friction to 0.3'))
      .toMatchObject({ won: true, full: true, overtime: false });
  });

  it('can park on the outward trip without claiming the stars beyond the dock', () => {
    expect(play('return-to-dock', w => w.ball.position.x >= 280, 'Set surface friction to 1'))
      .toMatchObject({ won: true, full: false, overtime: false });
  });

  it.each([230, 300, 420, 540])('can soften the shared floor during flight at tick %s', tick => {
    expect(play('one-last-bounce', w => w.tick >= tick, 'Set surface bounce to 0 and surface friction to 0.3'))
      .toMatchObject({ won: true, full: true, overtime: false });
  });

  it('cannot reach the landing bay if the shared floor is softened before the first impact', () => {
    expect(play('one-last-bounce', () => true, 'Set surface bounce to 0 and surface friction to 0.3'))
      .toMatchObject({ won: false, full: false });
  });

  it('changing the landing material in flight preserves velocity and only affects the next contact', () => {
    const world = new PhysicsWorld(findLevel('one-last-bounce')!);
    try {
      send(world, 'Set surface bounce to 0.9'); world.start();
      while (world.tick < 360) world.step();
      const before = { ...world.ball.velocity };
      expect(before.y).toBeLessThan(0);
      send(world, 'Set surface bounce to 0 and surface friction to 0.3');
      expect(world.ball.velocity).toEqual(before);
      while (world.running) world.step();
      expect(world.won).toBe(true); expect(world.stars.fullScore).toBe(true);
    } finally { world.destroy(); }
  });
});
