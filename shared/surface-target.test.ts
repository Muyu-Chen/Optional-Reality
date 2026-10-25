import { describe, expect, it } from 'vitest';
import { parseCommand } from './commands';
import { applyRules } from './rules';
import { catchCup } from '../client/src/levels/catch-cup';
import { frictionRunway } from '../client/src/levels/friction-runway';
import { initialRules, ruleContext } from '../client/src/levels/rules';

describe('scene-defined surface names', () => {
  it.each([
    ['Set launch pad bounce to 1.1','launch-pad',1.1],
    ['Set cup bounce to 0','cup-base',0],
    ["Set the cup's bounce to 0.1",'cup-base',.1],
    ['Set cup-base restitution to 0','cup-base',0],
    ['设置杯底弹性为0','cup-base',0],
    ['设置发射板弹性为1.1','launch-pad',1.1],
  ] as const)('resolves %s without touching another surface', (text,target,value) => {
    expect(parseCommand(text,ruleContext(catchCup)).operation).toEqual({type:'set_property',target,property:'restitution',value});
  });
  it.each(['Set missing pad bounce to 0','Set cup lid bounce to 0','Set cupcake bounce to 0','Set block friction to 0'])('rejects unknown or protected targets: %s', text => {
    expect(parseCommand(text,ruleContext(catchCup)).error).toBeTruthy();
  });
  it('changes editable surfaces globally while keeping preset walls protected', () => {
    for(const text of ['Set left cup wall bounce to 0.5']) {
      const result=parseCommand(text,ruleContext(catchCup));expect(result.operation).toBeDefined();
      expect(()=>applyRules(initialRules(catchCup),[result.operation],ruleContext(catchCup))).toThrow('cannot be edited');
    }
    const parsed=parseCommand('Set surface bounce to 0.5',ruleContext(catchCup));
    const next=applyRules(initialRules(catchCup),[parsed.operation],ruleContext(catchCup));
    expect(next.values.world.restitution).toBe(.5);expect(next.values['cup-base'].restitution).toBe(.5);
    expect(next.values['launch-pad'].restitution).toBe(.5);expect(next.values['cup-left'].restitution).toBe(0);
  });
  it('supports the Grip surface name, its aliases and existing runway messages', () => {
    for(const [text,target] of [
      ['Set surface friction to 0.3','world'],
      ['Set grip surface friction to 0.3','runway'],
      ['Set grip friction to 0.3','runway'],
      ['Set friction pad friction to 0.3','runway'],
      ['设置摩擦表面摩擦为0.3','runway'],
      ['设置摩擦板摩擦为0.3','runway'],
      ['Set runway friction to 0.3','runway'],
      ['设置跑道摩擦为0.3','runway'],
    ] as const) {
      expect(parseCommand(text,ruleContext(frictionRunway)).operation).toEqual({type:'set_property',target,property:'friction',value:.3});
    }
  });
  it('applies the named Grip surface rule without changing environment acceleration', () => {
    const context=ruleContext(frictionRunway),before=initialRules(frictionRunway);
    const parsed=parseCommand('Set grip surface friction to 0.3',context);
    expect(parsed.operation).toBeDefined();
    const after=applyRules(before,[parsed.operation],context);
    expect(after.values.runway.friction).toBe(.3);
    expect(after.acceleration).toEqual(before.acceleration);
    expect(after.values.world.friction).toBe(before.values.world.friction);
  });
});
