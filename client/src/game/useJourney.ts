import { useCallback, useEffect, useState } from 'react';
import { findLevel } from '../levels/catalog';
import { completeLevel, loadJourney, saveJourney } from './journey-progress';
import { journeyUrl, readJourneyRoute, type JourneyRoute } from './journey-navigation';

export function useJourney() {
  const [navigation, setNavigation] = useState(() => ({ route: readJourneyRoute(window.location.search), visit: 0 }));
  const [progress, setProgress] = useState(loadJourney);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    function pop() { setNavigation(previous => ({ route: readJourneyRoute(window.location.search), visit: previous.visit + 1 })); }
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  useEffect(() => {
    if (navigation.route.view !== 'game') {
      document.title = `${navigation.route.view === 'levels' ? 'Choose a level' : 'Change the rules'} — Optional Reality`;
      return;
    }
    const id = navigation.route.levelId;
    setProgress(previous => previous.lastLevel === id ? previous : { ...previous, lastLevel: id });
  }, [navigation]);

  useEffect(() => { setStorageAvailable(saveJourney(progress)); }, [progress]);

  const navigate = useCallback((route: JourneyRoute) => {
    const next = journeyUrl(window.location.href, route);
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) window.history.pushState(null, '', next);
    // Choosing the same level is still an explicit new attempt.
    setNavigation(previous => ({ route, visit: previous.visit + 1 }));
  }, []);
  const chooseLevel = useCallback((id: string) => { if (findLevel(id)) navigate({ view: 'game', levelId: id }); }, [navigate]);
  const recordCompletion = useCallback((id: string, stars: number) => {
    setProgress(previous => completeLevel(previous, id, stars));
  }, []);

  return { ...navigation, progress, storageAvailable, chooseLevel, recordCompletion,
    showTitle: () => navigate({ view: 'title' }), showLevels: () => navigate({ view: 'levels' }) };
}
