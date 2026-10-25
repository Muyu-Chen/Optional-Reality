// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { completeLevel, emptyJourney, JOURNEY_STORAGE_KEY, journeyStars, loadJourney, saveJourney } from './journey-progress';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('local journey progress', () => {
  it('starts empty and retains a zero-star clear as a real completed level', () => {
    expect(loadJourney()).toEqual(emptyJourney());
    const progress = completeLevel(emptyJourney(), 'bounce', 0);
    expect(Object.hasOwn(progress.completed, 'bounce')).toBe(true);
    expect(saveJourney(progress)).toBe(true);
    expect(loadJourney()).toEqual(progress);
  });
  it('keeps the best completed score and never mutates the prior progress', () => {
    const first = completeLevel({ lastLevel: 'bounce', completed: {} }, 'bounce', 2);
    const better = completeLevel(first, 'bounce', 3);
    expect(first.completed.bounce).toBe(2);
    expect(better.completed.bounce).toBe(3);
    expect(completeLevel(better, 'bounce', 1)).toBe(better);
    expect(journeyStars(completeLevel(better, 'multi-bounce', 2))).toBe(5);
  });
  it.each([-1, 4, 1.5, NaN, Infinity])('ignores impossible completion counts: %s', stars => {
    const initial = emptyJourney();
    expect(completeLevel(initial, 'bounce', stars)).toBe(initial);
  });
  it('discards unknown levels and malformed stored counts without inventing earned stars', () => {
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify({ version: 1, lastLevel: 'missing', completed: {
      bounce: 4, 'gravity-lab': 2, 'multi-bounce': '3', 'catch-cup': 0, missing: 3,
    } }));
    expect(loadJourney()).toEqual({ lastLevel: null, completed: { 'gravity-lab': 2, 'catch-cup': 0 } });
  });
  it.each(['broken json', 'null', '[]', '{"version":2}', '{"version":1,"completed":[]}'])('recovers from invalid storage %s', raw => {
    localStorage.setItem(JOURNEY_STORAGE_KEY, raw);
    expect(loadJourney()).toEqual(emptyJourney());
  });
  it('keeps playable in-memory progress when storage is denied', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(loadJourney()).toEqual(emptyJourney());
    const progress = completeLevel(emptyJourney(), 'bounce', 1);
    expect(saveJourney(progress)).toBe(false);
    expect(progress.completed.bounce).toBe(1);
  });
});
