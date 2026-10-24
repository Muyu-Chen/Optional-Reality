import { gravityLab } from './gravity-lab';
import { realityBreakdown } from './reality-breakdown';
import { bounce } from './bounce';
import { toaster } from './toaster';
import { breeze } from './breeze';

// Ordered entry points; the bakery is an advanced experiment, not a required second lesson.
export const levels = [gravityLab, bounce, toaster, breeze, realityBreakdown] as const;
export const findLevel = (id: string) => levels.find(level => level.id === id);
