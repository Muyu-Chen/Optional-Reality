import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { messageOperations, prepareMessage } from '../domain/queue';
import { bounce } from '../levels/bounce';
import { ruleContext } from '../levels/rules';
import { PhysicsWorld } from './world';

function floorRoute(trigger: number | 'impact') {
  const world = new PhysicsWorld(bounce);
  let impact: { tick: number; x: number } | undefined;
  let applied: { tick: number; x: number; vy: number; groundCollected: boolean } | undefined;
  let groundTick: number | undefined;
  Matter.Events.on(world.engine, 'collisionStart', event => {
    if (!impact && event.pairs.some(pair => (pair.bodyA === world.ball && pair.bodyB.label === 'bounce-floor')
      || (pair.bodyB === world.ball && pair.bodyA.label === 'bounce-floor'))) {
      impact = { tick: world.tick + 1, x: world.ball.position.x };
    }
  });
  const send = (text: string) => {
    const message = prepareMessage(text, text, ruleContext(bounce), world.rules);
    expect(message.status).toBe('ready');
    world.applyMessages([{ text, operations: messageOperations(message) }]);
  };
  try {
    send('Set surface bounce to 0.1');
    world.start();
    while (!world.won && !world.timedOut) {
      if (!applied && (trigger === 'impact' ? !!impact : world.tick >= trigger)) {
        applied = { tick: world.tick, x: world.ball.position.x, vy: Matter.Body.getVelocity(world.ball).y,
          groundCollected: world.stars.collected.has('ground') };
        send('add acceleration upward of 1');
      }
      world.step();
      if (groundTick === undefined && world.stars.collected.has('ground')) groundTick = world.tick;
    }
    return { impact, applied, groundTick, won: world.won, full: world.stars.fullScore, stars: [...world.stars.collected] };
  } finally { world.destroy(); }
}

describe('low bounce with upward acceleration near floor impact', () => {
  // The unmodified low-bounce first impact occurs at tick 314. These samples
  // cover 0.25 seconds before it through 0.15 seconds after it, at 120 Hz.
  it.each([284, 'impact', 332] as const)('collects three stars and exits when upward acceleration is sent at %s', trigger => {
    const result = floorRoute(trigger);
    expect(result.won).toBe(true);
    expect(result.full).toBe(true);
    expect(result.stars).toEqual(['ground', 'rise', 'approach']);
    expect(result.applied?.groundCollected).toBe(false);
    expect(result.groundTick).toBeGreaterThan(result.applied!.tick);
    if (trigger === 'impact') {
      expect(result.impact).toEqual({ tick: 314, x: 434 });
      expect(result.applied?.tick).toBe(result.impact?.tick);
      expect(result.applied?.x).toBe(434);
    } else if (trigger === 284) {
      expect(result.applied?.vy).toBeGreaterThan(0);
      expect(result.impact!.tick).toBeGreaterThan(result.applied!.tick);
    } else {
      expect(result.impact!.tick).toBeLessThan(result.applied!.tick);
    }
  });

  it('does not call a late command after collecting the low star a full-score route', () => {
    const result = floorRoute(344);
    expect(result.won).toBe(true);
    expect(result.full).toBe(false);
    expect(result.applied?.groundCollected).toBe(true);
    expect(result.groundTick).toBeLessThan(result.applied!.tick);
    expect(result.stars).not.toContain('approach');
  });
});
