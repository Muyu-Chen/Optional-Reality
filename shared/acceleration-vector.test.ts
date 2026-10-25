import { describe, expect, it } from 'vitest';
import { prepareMessage } from '../client/src/domain/queue';
import { gravityLab } from '../client/src/levels/gravity-lab';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { applyRules, validateRuleState } from './rules';

const context = ruleContext(gravityLab);
describe('one environment acceleration vector', () => {
  it.each([
    ['gravity downward 20',{x:0,y:20}],['acceleration downward 20',{x:0,y:20}],
    ['gravity upward 20',{x:0,y:-20}],['acceleration upward 20',{x:0,y:-20}],
    ['重力向下 20',{x:0,y:20}],['向上加速度 20',{x:0,y:-20}],
  ])('maps %s to the same vector semantics', (text, expected) => {
    const before=initialRules(gravityLab),message=prepareMessage('m',text,context,before);
    expect(message.status).toBe('ready');
    expect(message.adjustments).toBeUndefined();
    const next=applyRules(before,[message.operation],context);
    expect(next.acceleration).toEqual(expected);
    expect(next).not.toHaveProperty('gravity');
    expect(next.values.world).not.toHaveProperty('acceleration_x');
    expect(next.values.world).not.toHaveProperty('acceleration_y');
  });
  it('preserves the other component and replaces gravity aliases rather than accumulating forces', () => {
    const first=applyRules(initialRules(gravityLab),[{type:'set_property',target:'world',property:'acceleration_x',value:2},{type:'set_gravity',acceleration:10}],context);
    const up=prepareMessage('up','add acceleration upward 20',context,first);
    const next=applyRules(first,[up.operation],context);
    expect(next.acceleration).toEqual({x:2,y:-20});
    expect(applyRules(next,[{type:'reverse_gravity'}],context).acceleration).toEqual({x:2,y:20});
    expect(first.acceleration).toEqual({x:2,y:10});
  });
  it('rejects a duplicate acceleration stored in scalar property values or old top-level gravity', () => {
    const state=initialRules(gravityLab);
    expect(()=>validateRuleState({...state,gravity:1},context)).toThrow();
    for (const property of ['gravity','acceleration_x','acceleration_y']) {
      expect(()=>validateRuleState({...state,values:{world:{[property]:1}}},context)).toThrow();
    }
  });
});
