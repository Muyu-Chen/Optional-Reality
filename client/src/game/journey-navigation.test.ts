import { describe, expect, it } from 'vitest';
import { journeyUrl, readJourneyRoute } from './journey-navigation';

describe('journey routes', () => {
  it.each(['', '?utm_source=friend', '?view=unknown'])('opens the title screen for %s', search => {
    expect(readJourneyRoute(search)).toEqual({ view: 'title' });
  });
  it('opens the actual chapter gallery and sends unavailable deep links there safely', () => {
    expect(readJourneyRoute('?view=levels')).toEqual({ view: 'levels' });
    expect(readJourneyRoute('?level=not-a-level')).toEqual({ view: 'levels' });
  });
  it('preserves playable deep links, including the older bakery ID', () => {
    expect(readJourneyRoute('?level=bounce')).toEqual({ view: 'game', levelId: 'bounce' });
    expect(readJourneyRoute('?level=reality-breakdown&view=levels')).toEqual({ view: 'game', levelId: 'reality-breakdown' });
  });
  it('updates only the navigation parameters and preserves the pathname, other parameters and fragment', () => {
    expect(journeyUrl('https://example.org/demo/?level=bounce&utm_source=friend#game', { view: 'title' })).toBe('/demo/?utm_source=friend#game');
    expect(journeyUrl('https://example.org/demo/?view=levels&utm_source=friend', { view: 'game', levelId: 'catch-cup' })).toBe('/demo/?utm_source=friend&level=catch-cup');
    expect(journeyUrl('https://example.org/demo/?level=bounce', { view: 'levels' })).toBe('/demo/?view=levels');
  });
});
