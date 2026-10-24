import { describe, expect, it } from 'vitest';
import { realityBreakdown } from '../levels/reality-breakdown';
import { initialRules } from '../levels/rules';
import { PhysicsWorld } from './world';

const message = { text: 'gravity', operations: [{ type: 'set_gravity' as const, acceleration: 1 }] };

describe('world command limits and atomic application', () => {
  it('counts messages rather than operations and rejects an overflowing batch as a whole', () => {
    const world = new PhysicsWorld({ ...realityBreakdown, commandLimit: 2 });
    try {
      world.applyMessages([{ text: 'two intents', operations: [...message.operations, { type: 'reverse_gravity' }] }]);
      expect(world.commandCount).toBe(1);
      const rules = structuredClone(world.rules);
      expect(() => world.applyMessages([message, message])).toThrow('budget');
      expect(world.rules).toEqual(rules);
      expect(world.engine.gravity.y).toBe(-1);
      expect(world.commandCount).toBe(1);
      world.applyMessages([message]);
      expect(world.commandCount).toBe(2);
      expect(world.undoRule()).toBe(true);
      world.applyMessages([message]);
      expect(world.commandCount).toBe(2);
    } finally { world.destroy(); }
  });

  it.each([
    { messages: [] },
    { messages: [{ text: 'empty', operations: [] }] },
    { messages: [message, { text: 'empty', operations: [] }] },
  ])('rejects an empty message/batch without changing the world: %#', ({ messages }) => {
    const world = new PhysicsWorld(realityBreakdown);
    try {
      expect(() => world.applyMessages(messages)).toThrow('Empty');
      expect(world.rules).toEqual(initialRules(realityBreakdown));
      expect(world.commandCount).toBe(0);
    } finally { world.destroy(); }
  });

  it('undoes all rules back to the initial state without changing body position', () => {
    const world = new PhysicsWorld(realityBreakdown);
    try {
      expect(world.undoRule()).toBe(false);
      world.applyMessages([message, { text: 'reverse', operations: [{ type: 'reverse_gravity' }] }]);
      world.start(); world.step(); world.pause();
      const position = { ...world.ball.position }, tick = world.tick;
      expect(world.undoRule()).toBe(true);
      expect(world.undoRule()).toBe(true);
      expect(world.undoRule()).toBe(false);
      expect(world.rules).toEqual(initialRules(realityBreakdown));
      expect(world.commandCount).toBe(0);
      expect(world.ball.position).toEqual(position);
      expect(world.tick).toBe(tick);
    } finally { world.destroy(); }
  });
});
