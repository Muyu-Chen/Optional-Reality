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
  it.each([
    [gravityLab, ['Gravity']],
    [bounce, ['Surface bounce']],
    [multiBounce, ['Gravity','Surface bounce']],
    [frictionRunway, ['Gravity','Surface friction']],
    [catchCup, ['Gravity','Launch pad bounce','Cup base bounce']],
    [toaster, ['Toaster power']],
    [breeze, ['Airflow']],
    [realityBreakdown, ['Gravity', 'Surface bounce', 'Surface friction', 'Conveyor speed', 'Toaster power', 'Airflow', 'Touch switch → gate']],
  ] as const)('only advertises permitted rules in $0.id', (level, expected) => {
    expect(editableRuleLabels(level)).toEqual(expected);
  });

  it('follows scene permissions and names a spring without a bakery theme', () => {
    expect(editableRuleLabels({ ...toaster, presentation: undefined })).toEqual(['Spring strength']);
    expect(editableRuleLabels({ ...toaster, editableDevices: [] })).toEqual([]);
  });
});
