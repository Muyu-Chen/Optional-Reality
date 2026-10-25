import { findLevel } from '../levels/catalog';

export type JourneyRoute = { view: 'title' | 'levels' } | { view: 'game'; levelId: string };

export function readJourneyRoute(search: string): JourneyRoute {
  const params = new URLSearchParams(search);
  const id = params.get('level');
  if (id && findLevel(id)) return { view: 'game', levelId: id };
  return { view: params.get('view') === 'levels' || !!id ? 'levels' : 'title' };
}

export function journeyUrl(href: string, route: JourneyRoute): string {
  const url = new URL(href);
  url.searchParams.delete('level');
  url.searchParams.delete('view');
  if (route.view === 'game') url.searchParams.set('level', route.levelId);
  if (route.view === 'levels') url.searchParams.set('view', 'levels');
  return `${url.pathname}${url.search}${url.hash}`;
}
