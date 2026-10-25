import { findLevel, levels } from '../levels/catalog';

export const JOURNEY_STORAGE_KEY = 'optional-reality.journey.v1';
export interface JourneyProgress {
  lastLevel: string | null;
  completed: Record<string, number>;
}
export const emptyJourney = (): JourneyProgress => ({ lastLevel: null, completed: {} });

/** Only completed attempts count. A failed run never replaces a personal best. */
export function completeLevel(progress: JourneyProgress, id: string, stars: number): JourneyProgress {
  const level = findLevel(id);
  if (!level || !Number.isInteger(stars) || stars < 0 || stars > (level.stars?.length || 0)) return progress;
  if (Object.hasOwn(progress.completed, id) && progress.completed[id] >= stars) return progress;
  return { ...progress, completed: { ...progress.completed, [id]: stars } };
}

export function loadJourney(): JourneyProgress {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(JOURNEY_STORAGE_KEY) || 'null');
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return emptyJourney();
    const raw = value as { lastLevel?: unknown; completed?: unknown };
    const completed: Record<string, number> = {};
    if (raw.completed && typeof raw.completed === 'object' && !Array.isArray(raw.completed)) {
      for (const level of levels) {
        const stars: unknown = (raw.completed as Record<string, unknown>)[level.id];
        if (typeof stars === 'number' && Number.isInteger(stars) && stars >= 0 && stars <= (level.stars?.length || 0)) completed[level.id] = stars;
      }
    }
    return { lastLevel: typeof raw.lastLevel === 'string' && findLevel(raw.lastLevel) ? raw.lastLevel : null, completed };
  } catch { return emptyJourney(); }
}

export function saveJourney(progress: JourneyProgress): boolean {
  try {
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify({ version: 1, ...progress }));
    return true;
  } catch { return false; }
}

export const journeyStars = (progress: JourneyProgress) => Object.values(progress.completed).reduce((sum, stars) => sum + stars, 0);
export const availableStars = levels.reduce((sum, level) => sum + (level.stars?.length || 0), 0);
