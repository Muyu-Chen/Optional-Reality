import { describe, expect, it } from 'vitest';
import { applyRules } from '../../../shared/rules';
import { gravityLab } from '../levels/gravity-lab';
import { realityBreakdown } from '../levels/reality-breakdown';
import { initialRules, ruleContext } from '../levels/rules';
import { appliedFeedback } from './feedback';

describe('applied environment captions', () => {
  it('reads the resolved gravity instead of repeating a relative command', () => {
    const before = {...initialRules(gravityLab),gravity:2};
    const operations = [{type:'reverse_gravity'}] as const;
    const after = applyRules(before,operations,ruleContext(gravityLab));
    expect(appliedFeedback(operations,before,after,gravityLab)).toEqual(['Gravity now pulls upward at 2 m/s².']);
  });
  it('shows the final result once when a message changes gravity several times', () => {
    const before = initialRules(gravityLab);
    const operations = [{type:'set_gravity',acceleration:2},{type:'set_gravity',acceleration:0}] as const;
    const after = applyRules(before,operations,ruleContext(gravityLab));
    expect(appliedFeedback(operations,before,after,gravityLab)).toEqual(['Gravity turned off. Momentum remains.']);
  });
  it('uses actual device values and scene names for a combined rule', () => {
    const before = initialRules(realityBreakdown);
    before.values['fan-main'].fan_power = .4;
    const operations = [{type:'scale_property',target:'fan-main',property:'fan_power',factor:2},{type:'add_sensor_trigger',sensor:'sensor-gate',gate:'gate-final'}] as const;
    const after = applyRules(before,operations,ruleContext(realityBreakdown));
    expect(appliedFeedback(operations,before,after,realityBreakdown)).toEqual(['Fan power increased to 0.8.','The pickup bell will open the shutter.']);
  });
});
