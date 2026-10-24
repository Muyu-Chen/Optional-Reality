import { describe, expect, it } from 'vitest';
import { gravityLab } from './gravity-lab';
import { bounce } from './bounce';
import { toaster } from './toaster';
import { breeze } from './breeze';
import { realityBreakdown } from './reality-breakdown';
import { editableRuleLabels } from './presentation';
import { multiBounce } from './multi-bounce';
import { frictionRunway } from './friction-runway';
import { catchCup } from './catch-cup';

describe('player-facing capabilities', () => {
  const base = ['Gravity','Horizontal acceleration','Surface bounce','Surface friction'];
  it.each([
    [gravityLab, base],
    [bounce, base],
    [multiBounce, base],
    [frictionRunway, base],
    [catchCup, [...base,'Launch pad bounce','Cup base bounce','Cup base friction']],
    [toaster, [...base,'Toaster power']],
    [breeze, [...base,'Airflow']],
    [realityBreakdown, [...base, 'Conveyor speed', 'Toaster power', 'Airflow', 'Touch switch → gate']],
  ] as const)('only advertises permitted rules in $0.id', (level, expected) => {
    expect(editableRuleLabels(level)).toEqual(expected);
  });

  it('follows scene permissions and names a spring without a bakery theme', () => {
    expect(editableRuleLabels({ ...toaster, presentation: undefined })).toEqual([...base,'Spring strength']);
    expect(editableRuleLabels({ ...toaster, editableDevices: [] })).toEqual(base);
  });
});
