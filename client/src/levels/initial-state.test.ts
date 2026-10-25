import { describe, expect, it } from 'vitest';
import { initialStateSummary } from './initial-state';
import { gravityLab } from './gravity-lab';
import { bounce } from './bounce';
import { catchCup } from './catch-cup';
import { frictionRunway } from './friction-runway';
import { realityBreakdown } from './reality-breakdown';
import { levels } from './catalog';

describe('initial state descriptions', () => {
  it('describes zero acceleration and rest without pretending gravity is active', () => {
    expect(initialStateSummary(gravityLab)).toEqual({
      actor: 'Ball', motion: 'At rest', acceleration: 'None · 0 m/s²',
      surfaces: ['Surfaces · bounce 0 · friction 0'], devices: [],
    });
  });
  it('uses the initial velocity in metres per second, rather than pixels per frame', () => {
    expect(initialStateSummary(bounce)).toMatchObject({ motion: 'Right · 1.5 m/s', acceleration: 'Down · 1 m/s²' });
    expect(initialStateSummary(frictionRunway)).toMatchObject({ actor: 'Block', motion: 'Right · 2 m/s' });
  });
  it('preserves local materials rather than showing global defaults for every surface', () => {
    expect(initialStateSummary(catchCup).surfaces).toEqual([
      'Launch pad · bounce 0.1 · friction 0', 'Cup base · bounce 1.05 · friction 0.5',
    ]);
  });
  it('describes the initial bakery devices without displaying editable permissions as state', () => {
    expect(initialStateSummary(realityBreakdown)).toMatchObject({
      actor: 'Bread', motion: 'At rest', acceleration: 'Down · 8 m/s²',
      devices: ['Conveyor stopped', 'Toaster off', 'Fan off', 'Bell waiting', 'Shutter closed'],
    });
  });
  it('keeps both components and their signs for diagonal motion and acceleration', () => {
    const level = { ...bounce, initialAcceleration: [-2, -3] as const, ball: { ...bounce.ball, velocity: [-1, 2] as const } };
    expect(initialStateSummary(level)).toMatchObject({ motion: 'Left 1, down 2 m/s', acceleration: 'Left 2, up 3 m/s²' });
  });
  it('describes running devices and their actual direction', () => {
    const level = { ...realityBreakdown, devices: [
      { kind: 'conveyor' as const, id: 'belt', area: { x: 0, y: 0, width: 10, height: 10 }, speed: -2 },
      { kind: 'fan' as const, id: 'fan', area: { x: 0, y: 0, width: 10, height: 10 }, power: .5, acceleration: [0, -4] as const },
      { kind: 'rotor' as const, id: 'wheel', position: [0, 0] as const, radius: 10, angularSpeed: -1 },
    ] };
    expect(initialStateSummary(level).devices).toEqual(['Conveyor Left · 2 m/s', 'Fan Up · 2 m/s²', 'Wheel -1 rad/s']);
  });
  it.each(levels)('can describe $id without mutating its configuration', level => {
    const before = JSON.stringify(level);
    const summary = initialStateSummary(level);
    expect(summary.motion).toBeTruthy();expect(summary.acceleration).toBeTruthy();
    expect(JSON.stringify(summary)).not.toMatch(/undefined|NaN/);
    expect(JSON.stringify(level)).toBe(before);
  });
});
