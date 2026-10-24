import { gravityLab } from './gravity-lab';
import { realityBreakdown } from './reality-breakdown';

// Ordered entry points; the bakery is an advanced experiment, not a required second lesson.
export const levels = [gravityLab, realityBreakdown] as const;
export const findLevel = (id: string) => levels.find(level => level.id === id);
