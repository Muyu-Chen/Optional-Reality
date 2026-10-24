import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { realityBreakdown } from '../levels/reality-breakdown';
import { ruleContext } from '../levels/rules';
import { prepareMessage, messageOperations } from '../domain/queue';
import { PhysicsWorld } from './world';

const setup = realityBreakdown.instructions.exampleMessages;
const apply = (world: PhysicsWorld, texts: readonly string[]) => world.applyMessages(texts.map(text => {
  const message = prepareMessage(text, text, ruleContext(world.level), world.rules);
  if (message.status !== 'ready') throw new Error(message.error);
  return { text, operations: messageOperations(message) };
}));
const simulate = (world: PhysicsWorld, ticks = 3600) => { world.start(); for (let i = 0; i < ticks && !world.won && !world.timedOut; i++) {if(world.tutorialId)world.continueTutorial();world.step();} };

describe('factory devices in Matter.js', () => {
  it('reaches the exit using the teammate’s four environment rules', () => {
    const world = new PhysicsWorld(realityBreakdown);
    try {
      apply(world, setup); simulate(world);
      expect(world.devices.firedSprings.has('spring-main'), JSON.stringify(world.snapshot())).toBe(true);
      expect(world.devices.openGates.has('gate-final'), JSON.stringify(world.snapshot())).toBe(true);
      expect(world.won, JSON.stringify(world.snapshot())).toBe(true);
      expect(world.commandCount).toBe(4);
    } finally { world.destroy(); }
  });
  it('keeps the gate closed without a sensor rule', () => {
    const world = new PhysicsWorld(realityBreakdown);
    try {
      apply(world, setup.slice(0, 3)); simulate(world);
      expect(world.won).toBe(false);
      expect(world.devices.openGates.size).toBe(0);
    } finally { world.destroy(); }
  });
  it('does not launch or open a gate before physical contact', () => {
    const world = new PhysicsWorld(realityBreakdown);
    try {
      apply(world, setup.slice(1)); simulate(world, 120);
      expect(world.devices.openGates.size).toBe(0);
      expect(world.devices.firedSprings.size).toBe(0);
      expect(world.ball.position.x).toBeCloseTo(160, 3);
    } finally { world.destroy(); }
  });
  it('applies wind only in the fan field', () => {
    const world = new PhysicsWorld(realityBreakdown);
    try {
      world.setGravity(0); apply(world, ['Set fan power to 1']);
      Matter.Body.setPosition(world.ball, { x: 600, y: 230 });
      simulate(world, 30);
      expect(world.ball.position.y).toBeLessThan(220);
      expect(world.ball.position.x).toBeCloseTo(600, 5);
    } finally { world.destroy(); }
  });
  it('spinning rotors affect the core only on contact', () => {
    // Rotation remains a supported runtime device, outside the first three tiers.
    const world = new PhysicsWorld({...realityBreakdown,number:7,devices:[...realityBreakdown.devices!,{kind:'rotor',id:'rotor-main',position:[748,180],radius:26,angularSpeed:0}]});
    try {
      world.setGravity(0); apply(world, ['Make the wheel spin clockwise at speed 1']);
      Matter.Body.setPosition(world.ball, { x: 748, y: 140 });
      simulate(world, 1);
      expect(world.ball.velocity.x).toBe(0);
      Matter.Body.setPosition(world.ball, { x: 748, y: 141.2 });
      simulate(world, 1);
      expect(world.ball.velocity.x).toBeGreaterThan(0);
    } finally { world.destroy(); }
  });
  it('undo restores only rules and refunds the command; retry keeps rules and rebuilds the run', () => {
    const world = new PhysicsWorld(realityBreakdown);
    let retry: PhysicsWorld | undefined;
    try {
      apply(world, setup); simulate(world, 60);
      const position = { ...world.ball.position };
      expect(world.undoRule()).toBe(true);
      expect(world.rules.triggers).toEqual([]);
      expect(world.ball.position).toEqual(position);
      expect(world.commandCount).toBe(3);
      retry = world.retryWithRules();
      expect(retry.rules).toEqual(world.rules);
      expect(retry.commandCount).toBe(3);
      expect(retry.ball.position).toEqual({ x: 160, y: 407 });
      expect(retry.tick).toBe(0);
      expect(retry.started).toBe(false);
      expect(retry.devices.firedSprings.size).toBe(0);
    } finally { world.destroy(); retry?.destroy(); }
  });
  it('rejects an invalid whole batch without changing rules or spending commands', () => {
    const world = new PhysicsWorld(realityBreakdown);
    try {
      const before = structuredClone(world.rules);
      expect(() => world.applyMessages([
        { text: 'valid', operations: [{ type: 'set_gravity', acceleration: 2 }] },
        { text: 'core edit', operations: [{ type: 'set_property', target: 'energy-core', property: 'friction', value: 0 }] },
      ])).toThrow('cannot be edited');
      expect(world.rules).toEqual(before); expect(world.commandCount).toBe(0);
      for (let i = 0; i < 100; i++) apply(world, ['Set gravity to 8']);
      expect(() => apply(world, ['Set gravity to 8'])).toThrow('budget');
      expect(world.commandCount).toBe(100);
      world.undoRule(); apply(world, ['Set gravity to 8']);
      expect(world.commandCount).toBe(100);
    } finally { world.destroy(); }
  });
});
