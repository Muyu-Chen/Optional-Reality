import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { gravityLab } from '../levels/gravity-lab';
import type { LevelDefinition } from '../levels/types';
import { initialTelemetry, PhysicsWorld, STEP_MS } from './world';

const EXIT = gravityLab.exit;
const ROUND_TICKS = Math.round(gravityLab.timeLimitSeconds * 1000 / STEP_MS);

describe('zero-gravity lab', () => {
  it('starts and runs without gravity until a rule is explicitly applied', () => {
    const world = new PhysicsWorld(gravityLab);
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
    const world = new PhysicsWorld(gravityLab);
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
    const world = new PhysicsWorld(gravityLab);
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
  it.each([
    ['left edge', EXIT.x - 16, EXIT.y + 10],
    ['top edge', EXIT.x + 20, EXIT.y - 16],
    ['bottom edge', EXIT.x + 20, EXIT.y + EXIT.height + 16],
    ['corner', EXIT.x - 11, EXIT.y - 11],
  ])('completes when the ball touches the %s without its centre entering the exit', (_, x, y) => {
    const world = new PhysicsWorld(gravityLab);
    try {
      Matter.Body.setPosition(world.ball, { x, y });
      world.start(); world.step();
      expect(world.won).toBe(true);
      expect(world.running).toBe(false);
    } finally { world.destroy(); }
  });
  it('does not complete when the ball passes just outside the exit', () => {
    const world = new PhysicsWorld(gravityLab);
    try {
      Matter.Body.setPosition(world.ball, { x: EXIT.x - 18, y: EXIT.y + 10 });
      world.start(); world.step();
      expect(world.won).toBe(false);
    } finally { world.destroy(); }
  });
  it('ends after 30 simulated seconds, excluding time before starting and while paused', () => {
    const world = new PhysicsWorld(gravityLab);
    try {
      for (let i = 0; i < 120; i++) world.step();
      expect(world.tick).toBe(0);
      world.start();
      for (let i = 0; i < ROUND_TICKS - 1; i++) world.step();
      expect(world.timedOut).toBe(false);
      world.pause();
      for (let i = 0; i < 120; i++) world.step();
      expect(world.tick).toBe(ROUND_TICKS - 1);
      world.start(); world.step();
      expect(world.tick).toBe(ROUND_TICKS);
      expect(world.timedOut).toBe(true);
      expect(world.running).toBe(false);
      world.start(); world.step();
      expect(world.running).toBe(false);
      expect(world.tick).toBe(ROUND_TICKS);
    } finally { world.destroy(); }
  });
  it('counts a touch on the last tick as a win', () => {
    const world = new PhysicsWorld(gravityLab);
    try {
      world.tick = ROUND_TICKS - 1;
      Matter.Body.setPosition(world.ball, { x: EXIT.x - 16, y: EXIT.y + 10 });
      world.start(); world.step();
      expect(world.won).toBe(true);
      expect(world.timedOut).toBe(false);
    } finally { world.destroy(); }
  });
});

// A separate definition proves the runtime does not fall back to Gravity Lab's layout.
const smallLevel: LevelDefinition = {
  id: 'runtime-test', number: 7, title: 'Small chamber',
  viewport: { width: 420, height: 320, pixelsPerMetre: 40 },
  timeLimitSeconds: 2, initialAcceleration:[0,-.5],
  ball: { id: 'test-ball', label: 'TEST', position: [55, 125], velocity: [.5, 0], radius: 9, restitution: 0 },
  tracks: [{ id: 'shelf', points: [[140, 230], [300, 230]], thickness: 8 }],
  guideLines: [],
  exit: { id: 'test-exit', label: 'EXIT', x: 340, y: 60, width: 40, height: 45 },
  instructions: {
    objective: 'Touch the exit', hint: 'Test fixture', sceneDescription: 'A smaller chamber.',
    canvasHeading: 'TEST', readyCaption: 'TEST', exampleMessages: [], suggestedMessages: [], exampleNotice: '',
  },
};

describe('level-driven physics', () => {
  it('uses the supplied spawn, gravity, velocity, unit scale, and room dimensions', () => {
    const world = new PhysicsWorld(smallLevel);
    try {
      expect(world.snapshot()).toMatchObject({ x: 55, y: 125, acceleration:{x:0,y:-.5}, tick: 0, started: false });
      expect(initialTelemetry(smallLevel)).toEqual(world.snapshot());
      world.start();
      for (let i = 0; i < 120; i++) world.step();
      expect(world.ball.position.x).toBeCloseTo(75, 6);
      expect(world.ball.position.y).toBeCloseTo(114.92, 1);
      world.setGravity(0);
      Matter.Body.setPosition(world.ball, { x: 400, y: 150 });
      Matter.Body.setVelocity(world.ball, { x: 4, y: 0 });
      for (let i = 0; i < 30; i++) world.step();
      expect(world.ball.position.x).toBeLessThan(412);
      expect(world.ball.position.x).toBeGreaterThan(400);
    } finally { world.destroy(); }
  });
  it('builds collisions from the supplied track and thickness', () => {
    const world = new PhysicsWorld(smallLevel);
    try {
      world.setGravity(1);
      Matter.Body.setPosition(world.ball, { x: 180, y: 210 });
      Matter.Body.setVelocity(world.ball, { x: 0, y: 0 });
      world.start();
      for (let i = 0; i < 120; i++) world.step();
      expect(world.ball.position.y).toBeCloseTo(217, 0);
    } finally { world.destroy(); }
  });
  it('uses the supplied exit position and ball radius for edge contact', () => {
    const world = new PhysicsWorld(smallLevel);
    try {
      world.setGravity(0);
      Matter.Body.setPosition(world.ball, { x: 332, y: 75 });
      Matter.Body.setVelocity(world.ball, { x: 0, y: 0 });
      world.start(); world.step();
      expect(world.won).toBe(true);
    } finally { world.destroy(); }
  });
  it('uses the supplied time limit rather than a global 30-second constant', () => {
    const world = new PhysicsWorld(smallLevel);
    try {
      world.start();
      for (let i = 0; i < 239; i++) world.step();
      expect(world.timedOut).toBe(false);
      world.step();
      expect(world.timedOut).toBe(true);
      expect(world.tick).toBe(240);
    } finally { world.destroy(); }
  });
  it('can create fresh worlds from the same level without sharing bodies or mutating its definition', () => {
    const definition = structuredClone(smallLevel);
    const first = new PhysicsWorld(smallLevel);
    const second = new PhysicsWorld(smallLevel);
    try {
      first.setGravity(1); first.start();
      for (let i = 0; i < 120; i++) first.step();
      expect(second.snapshot()).toMatchObject({ x: 55, y: 125, acceleration:{x:0,y:-.5}, tick: 0, started: false });
      expect(second.ball).not.toBe(first.ball);
      expect(smallLevel).toEqual(definition);
      first.destroy();
      second.start(); second.step();
      expect(second.tick).toBe(1);
    } finally { first.destroy(); second.destroy(); }
  });
});
