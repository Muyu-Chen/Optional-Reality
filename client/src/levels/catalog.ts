import { gravityLab } from './gravity-lab';
import { realityBreakdown } from './reality-breakdown';
import { bounce } from './bounce';
import { toaster } from './toaster';
import { breeze } from './breeze';
import { multiBounce } from './multi-bounce';
import { frictionRunway } from './friction-runway';
import { catchCup } from './catch-cup';
import { oneMoreTurn } from './one-more-turn';
import { bringItBack } from './bring-it-back';
import { overTheWall } from './over-the-wall';
import { sideDoor } from './side-door';
import { bankShot } from './bank-shot';
import { returnToDock } from './return-to-dock';
import { oneLastBounce } from './one-last-bounce';

// Ordered entry points; the bakery is an advanced experiment, not a required second lesson.
export const levels = [
  gravityLab, oneMoreTurn, bringItBack, overTheWall, sideDoor,
  bankShot, bounce, multiBounce, frictionRunway, catchCup, returnToDock, oneLastBounce,
  toaster, breeze, realityBreakdown,
] as const;
export const findLevel = (id: string) => levels.find(level => level.id === id);
