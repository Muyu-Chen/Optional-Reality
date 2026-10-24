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
  it('does not let aliases bypass readonly surfaces or global permissions', () => {
    for(const text of ['Set left cup wall bounce to 0.5','Set surface bounce to 0.5']) {
      const result=parseCommand(text,ruleContext(catchCup));expect(result.operation).toBeDefined();
      expect(()=>applyRules(initialRules(catchCup),[result.operation],ruleContext(catchCup))).toThrow('cannot be edited');
    }
  });
  it('supports friction both globally and on the named runway', () => {
    for(const [text,target] of [['Set surface friction to 0.3','world'],['Set runway friction to 0.3','runway']] as const) {
      expect(parseCommand(text,ruleContext(frictionRunway)).operation).toEqual({type:'set_property',target,property:'friction',value:.3});
    }
  });
});
