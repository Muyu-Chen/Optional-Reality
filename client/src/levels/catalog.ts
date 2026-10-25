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
import { threadTheGap } from './thread-the-gap';
import { downTheChimney } from './down-the-chimney';
import { hookTurn } from './hook-turn';
import { doubleBank } from './double-bank';
import { lowRoof } from './low-roof';
import { mindTheGap } from './mind-the-gap';

// Ordered entry points; the bakery is an advanced experiment, not a required second lesson.
export const levels = [
  gravityLab, oneMoreTurn, bringItBack, overTheWall, sideDoor, threadTheGap, downTheChimney, hookTurn,
  bankShot, bounce, multiBounce, frictionRunway, catchCup, returnToDock, oneLastBounce, doubleBank, lowRoof, mindTheGap,
  toaster, breeze, realityBreakdown,
] as const;
export const findLevel = (id: string) => levels.find(level => level.id === id);
