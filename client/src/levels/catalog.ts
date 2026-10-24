import { gravityLab } from './gravity-lab';
import { realityBreakdown } from './reality-breakdown';

// The factory is available to the runtime/compiler; no factory UI or selector is exposed yet.
export const levels = [gravityLab, realityBreakdown] as const;
export const findLevel = (id: string) => levels.find(level => level.id === id);
