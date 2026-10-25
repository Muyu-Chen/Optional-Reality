import Matter from 'matter-js';
import { describe, expect, it } from 'vitest';
import { bounce } from '../levels/bounce';
import type { LevelDefinition } from '../levels/types';
import { ImpactFeedback } from './impact-feedback';
import { PhysicsWorld } from './world';
import { physicsColours } from './visual-language';

function untilImpact(world: PhysicsWorld, feedback: ImpactFeedback) {
  world.start();
  for (let tick = 0; tick < 600; tick++) {
    world.step(); feedback.advance();
    if (feedback.state.active.length) return feedback.state.active[0];
  }
  throw new Error('No physical impact was observed.');
}

function fixture(speed: number, feature?: 'bounce' | 'friction'): LevelDefinition {
  return { ...bounce, id: 'impact-fixture', initialAcceleration: [0, 0],
    ball: { ...bounce.ball, position: [300, 380], velocity: [0, speed] },
    tracks: [{ id: 'floor', points: [[60, 427], [760, 427]], thickness: 14, feature }], stars: undefined };
}

describe('real incoming collision feedback', () => {
  it('uses pre-solve incoming normal speed regardless of the solved rebound speed', () => {
    const results = [0, .9].map(restitution => {
      const world = new PhysicsWorld(bounce), feedback = new ImpactFeedback(world);
      try {
        world.applyMessages([{ text: 'surface', operations: [{ type: 'set_property', target: 'world', property: 'restitution', value: restitution }] }]);
        const pulse = untilImpact(world, feedback);
        return { pulse, rebound: Matter.Body.getVelocity(world.ball).y * 60 / 80 };
      } finally { feedback.dispose(); world.destroy(); }
    });
    expect(results[0].pulse.speed).toBeCloseTo(2.6166667, 5);
    expect(results[1].pulse.speed).toBeCloseTo(results[0].pulse.speed, 9);
    expect(results[1].pulse.strength).toBeCloseTo(results[0].pulse.strength, 9);
    expect(Math.abs(results[1].rebound)).toBeGreaterThan(Math.abs(results[0].rebound) + 1);
    expect(results[0].pulse.normal.x).toBeCloseTo(0, 5);
    expect(results[0].pulse.normal.y).toBeLessThan(-.99);
    expect(results[0].pulse.y).toBeGreaterThan(419);
    expect(results[0].pulse.colour).toBe(physicsColours.bounce);
  });

  it('gives a stronger impact a stronger bounded response, while tiny drops and fast sliding stay quiet', () => {
    const strengths = [1, 3].map(speed => {
      const world = new PhysicsWorld(fixture(speed)), feedback = new ImpactFeedback(world);
      try { return untilImpact(world, feedback).strength; }
      finally { feedback.dispose(); world.destroy(); }
    });
    expect(strengths[1]).toBeGreaterThan(strengths[0]);
    expect(strengths[1]).toBeLessThanOrEqual(1);
    for (const level of [fixture(.1), { ...fixture(0), ball: { ...fixture(0).ball, position: [300, 404.5] as const, velocity: [5, 0] as const } }]) {
      const world = new PhysicsWorld(level), feedback = new ImpactFeedback(world);
      try {
        world.start();
        let emitted = false;
        for (let i = 0; i < 200; i++) { world.step(); feedback.advance(); emitted ||= feedback.state.active.some(pulse => pulse.surface === 'floor'); }
        expect(emitted).toBe(false);
      } finally { feedback.dispose(); world.destroy(); }
    }
  });

  it.each(['slope', 'wall'] as const)('reads the real %s contact normal and the corresponding material colour', kind => {
    const level: LevelDefinition = { ...fixture(0, kind === 'slope' ? 'friction' : undefined),
      ball: { ...bounce.ball, position: kind === 'slope' ? [300, 310] : [380, 250], velocity: kind === 'slope' ? [1.34, 2.68] : [3, 0] },
      tracks: [{ id: 'floor', points: kind === 'slope' ? [[200, 400], [600, 200]] : [[420, 100], [420, 450]],
        thickness: 10, feature: kind === 'slope' ? 'friction' : undefined }],
    };
    const world = new PhysicsWorld(level), feedback = new ImpactFeedback(world);
    try {
      const pulse = untilImpact(world, feedback);
      expect(pulse.speed).toBeGreaterThan(2.8);
      if (kind === 'slope') {
        expect(pulse.normal.x).toBeLessThan(-.4);
        expect(pulse.normal.y).toBeLessThan(-.8);
        expect(pulse.colour).toBe(physicsColours.friction);
      } else {
        expect(pulse.normal.x).toBeLessThan(-.99);
        expect(Math.abs(pulse.normal.y)).toBeLessThan(.01);
        expect(pulse.x).toBeGreaterThan(414);
        expect(pulse.colour).toBe(physicsColours.structure);
      }
    } finally { feedback.dispose(); world.destroy(); }
  });

  it('does not change a body, rules, scores or the complete physical route', () => {
    const world = new PhysicsWorld(bounce), control = new PhysicsWorld(bounce), feedback = new ImpactFeedback(world);
    try {
      world.start(); control.start();
      for (let i = 0; i < 700; i++) {
        world.step(); control.step(); feedback.advance();
        expect(world.ball.position).toEqual(control.ball.position);
        expect(Matter.Body.getVelocity(world.ball)).toEqual(Matter.Body.getVelocity(control.ball));
        expect(world.ball.angle).toBe(control.ball.angle);
        expect(world.ball.circleRadius).toBe(control.ball.circleRadius);
      }
      expect(world.rules).toEqual(control.rules);
      expect(world.snapshot()).toEqual(control.snapshot());
    } finally { feedback.dispose(); world.destroy(); control.destroy(); }
  });

  it('freezes with simulation time, clears reduced-motion effects and disposes both event observers', () => {
    const world = new PhysicsWorld(bounce), feedback = new ImpactFeedback(world);
    try {
      untilImpact(world, feedback);
      for (let i = 0; i < 4; i++) { world.step(); feedback.advance(); }
      world.pause();
      const time = feedback.state.time, pulses = structuredClone(feedback.state.active);
      for (let i = 0; i < 500; i++) { world.step(); feedback.advance(); }
      expect(feedback.state.time).toBe(time);
      expect(feedback.state.active).toEqual(pulses);
      feedback.advance(true); expect(feedback.state.active).toHaveLength(0);
      feedback.advance(false); expect(feedback.state.active).toHaveLength(0);
      feedback.dispose(); feedback.dispose();
      world.start(); for (let i = 0; i < 600; i++) { world.step(); feedback.advance(); }
      expect(feedback.state.active).toHaveLength(0);
      const retry = new PhysicsWorld(bounce), fresh = new ImpactFeedback(retry);
      try { expect(fresh.state.active).toHaveLength(0); expect(untilImpact(retry, fresh).speed).toBeGreaterThan(2); }
      finally { fresh.dispose(); retry.destroy(); }
    } finally { feedback.dispose(); world.destroy(); }
  });
});
