import { describe, expect, it } from 'vitest';
import { flightPosition, LOOP_SECONDS, STAR_TIMES, titleFrame } from './scene';

describe('title illustration timeline', () => {
  it('keeps velocity continuous when gravity is switched off', () => {
    const h = .0001, a = flightPosition(2.4 - h), b = flightPosition(2.4), c = flightPosition(2.4 + h);
    expect((b.y - a.y) / h).toBeCloseTo((c.y - b.y) / h, 1);
    expect(flightPosition(3).y - flightPosition(2.5).y).toBeCloseTo(36);
  });
  it('collects all three stars in order before absorption', () => {
    STAR_TIMES.forEach((at, index) => {
      expect(titleFrame(.9 + at + .01).activeStars).toBe(index + 1);
    });
    expect(titleFrame(4.39).activeStars).toBe(3);
    expect(titleFrame(4.39).ball.scale).toBe(1);
    expect(titleFrame(5.4).ball.scale).toBe(0);
  });
  it('loops to the same scene and provides a readable still frame', () => {
    expect(titleFrame(0)).toEqual(titleFrame(LOOP_SECONDS));
    expect(titleFrame(0, true)).toEqual(titleFrame(100, true));
    expect(titleFrame(0, true).stars.every(star => star.opacity === 1)).toBe(true);
  });
});
