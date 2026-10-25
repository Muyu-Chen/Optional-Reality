import { afterEach, describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { realityBreakdown } from '../levels/reality-breakdown';
import type { Operation } from '../../../shared/rules';
import { PhysicsWorld } from './world';

const worlds: PhysicsWorld[] = [];
afterEach(() => worlds.splice(0).forEach(world => world.destroy()));
function setup() {
  const world = new PhysicsWorld({ ...realityBreakdown, tutorials: [] });
  worlds.push(world);
  world.setGravity(0);
  return world;
}
function set(world: PhysicsWorld, target: string, property: 'fan_power' | 'conveyor_speed' | 'spring_power', value: number) {
  world.applyMessages([{ text: 'test rule', operations: [{ type: 'set_property', target, property, value }] }]);
}

describe('fan and conveyor contact boundaries', () => {
  it.each([-2, -1, 0, .5, 2])('applies vertical airflow at power %s with no horizontal push', power => {
    const world = setup();
    set(world, 'fan-main', 'fan_power', power);
    Matter.Body.setPosition(world.ball, { x: 650, y: 250 });
    world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.ball.force.x).toBe(0);
    expect(Math.sign(world.ball.force.y)).toBe(power === 0 ? 0 : -Math.sign(power));
  });

  it.each([
    ['left', 501.9, 250], ['right', 833.1, 250], ['above', 650, 116.9],
    ['below', 650, 451.1], ['outside corner', 504, 119],
  ])('does not apply wind just outside the %s', (_side, x, y) => {
    const world = setup();
    set(world, 'fan-main', 'fan_power', 1);
    Matter.Body.setPosition(world.ball, { x: Number(x), y: Number(y) });
    world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.ball.force).toEqual({ x: 0, y: 0 });
  });

  it('applies wind when the ball touches the field edge without its centre entering', () => {
    const world = setup();
    set(world, 'fan-main', 'fan_power', 1);
    Matter.Body.setPosition(world.ball, { x: 502, y: 250 });
    world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.ball.force.y).toBeLessThan(0);
  });

  it.each([-1, 1])('conveyor power %s requires physical floor contact', speed => {
    const world = setup();
    set(world, 'belt-main', 'conveyor_speed', speed);
    Matter.Body.setPosition(world.ball, { x: 200, y: 390 });
    world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.ball.force.x).toBe(0);
    Matter.Body.setPosition(world.ball, { x: 200, y: 408 });
    world.devices.beforeStep(world.rules, 1 / 120);
    expect(Math.sign(world.ball.force.x)).toBe(Math.sign(speed));
  });
});

describe('toaster and gate state transitions', () => {
  function touchingToaster() {
    const world = setup();
    set(world, 'spring-main', 'spring_power', 2);
    Matter.Body.setPosition(world.ball, { x: 467, y: 400 });
    world.devices.beforeStep(world.rules, 1 / 120);
    return world;
  }

  it('cancels charging and removes its constraint when power is disabled', () => {
    const world = touchingToaster();
    expect(world.engine.world.constraints).toHaveLength(1);
    world.devices.takeEvents();
    set(world, 'spring-main', 'spring_power', 0);
    for (let i = 0; i < 100; i++) world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.engine.world.constraints).toHaveLength(0);
    expect(world.devices.springs.get('spring-main')?.phase).toBe('idle');
    expect(world.devices.takeEvents()).toEqual([]);
    expect(world.devices.firedSprings.size).toBe(0);
  });

  it('uses the power active at release, fires once, then rearms only after leaving', () => {
    const world = touchingToaster();
    expect(world.devices.takeEvents()).toEqual([{ type: 'spring_contact', deviceId: 'spring-main' }, { type: 'spring_charging', deviceId: 'spring-main' }]);
    set(world, 'spring-main', 'spring_power', 3);
    for (let i = 0; i < 72; i++) world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.engine.world.constraints).toHaveLength(0);
    expect(Matter.Body.getVelocity(world.ball).x).toBeCloseTo((3 + .875 * 3) * 80 / 60);
    expect(world.devices.takeEvents()).toEqual([{ type: 'spring_released', deviceId: 'spring-main' }]);
    for (let i = 0; i < 120; i++) world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.devices.takeEvents()).toEqual([]);
    Matter.Body.setPosition(world.ball, { x: 400, y: 300 });
    world.devices.beforeStep(world.rules, 1 / 120);
    Matter.Body.setPosition(world.ball, { x: 467, y: 400 });
    world.devices.beforeStep(world.rules, 1 / 120);
    expect(world.devices.takeEvents()).toEqual([{ type: 'spring_contact', deviceId: 'spring-main' }, { type: 'spring_charging', deviceId: 'spring-main' }]);
  });

  it('opens a gate once on contact and closes it again when its rule is undone', () => {
    const world = setup();
    const trigger: Operation = { type: 'add_sensor_trigger', sensor: 'sensor-gate', gate: 'gate-final' };
    world.applyMessages([{ text: 'link bell', operations: [trigger, trigger] }]);
    expect(world.rules.triggers).toHaveLength(1);
    const count = world.engine.world.bodies.length;
    world.devices.afterStep(world.rules);
    expect(world.devices.openGates.size).toBe(0);
    Matter.Body.setPosition(world.ball, { x: 698, y: 255 });
    for (let i = 0; i < 10; i++) world.devices.afterStep(world.rules);
    expect(world.engine.world.bodies).toHaveLength(count - 1);
    expect(world.devices.openGates.has('gate-final')).toBe(true);
    world.undoRule();
    world.devices.syncRules(world.rules);
    expect(world.engine.world.bodies).toHaveLength(count);
    expect(world.devices.openGates.size).toBe(0);
  });
});
