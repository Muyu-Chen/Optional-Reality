import { describe, expect, it } from 'vitest';
import { parseCommands } from './commands';
import { prepareMessage } from '../client/src/domain/queue';
import { ruleContext, initialRules } from '../client/src/levels/rules';
import { findLevel } from '../client/src/levels/catalog';
import { applyRules } from './rules';

describe('qualitative rule preparation', () => {
  it('shows the concrete local surface value before it is applied', () => {
    const level=findLevel('bounce')!;
    const message=prepareMessage('a','Make this surface almost perfectly bouncy.',ruleContext(level),initialRules(level));
    expect(message.status).toBe('ready');
    expect(message.operation).toMatchObject({type:'set_property',target:'bounce-floor',property:'restitution',value:.95});
    expect(message.understoodAs).toContain('0.95');
  });
  it('does not guess a surface or replace unsupported quantities', () => {
    expect(parseCommands('Make this surface almost perfectly bouncy.',ruleContext(findLevel('multi-bounce')!)).error).toBeTruthy();
    for(const text of ['Give the ball a gentle upward acceleration of 5 newtons.','Make an imaginary surface perfectly bouncy.','Give the ball a gentle upward and downward acceleration.']) {
      expect(parseCommands(text,ruleContext(findLevel('bounce')!)).error).toBeTruthy();
    }
  });
  it.each(['Give the ball a gentle upward acceleration.','给小球轻柔的向上加速度'])('uses one environment component for %s', text => {
    const level=findLevel('bounce')!, rules=initialRules(level);rules.acceleration.x=2;
    const parsed=parseCommands(text,ruleContext(level));
    const after=applyRules(rules,parsed.operations!,ruleContext(level));
    expect(after.acceleration).toEqual({x:2,y:-.5});
  });
  it('resolves relative device wording when executed and preserves direction', () => {
    const level=findLevel('reality-breakdown')!, context=ruleContext(level), rules=initialRules(level);
    const parsed=parseCommands('Make the conveyor much slower.',context);
    expect(parsed.operations).toHaveLength(1);
    const op=parsed.operations![0];expect(op).toMatchObject({type:'scale_property',property:'conveyor_speed',factor:.25});
    if(op.type!=='scale_property')throw new Error('Expected relative speed');
    rules.values[op.target]={...rules.values[op.target],conveyor_speed:-2};
    expect(applyRules(rules,parsed.operations!,context).values[op.target].conveyor_speed).toBe(-.5);
    expect(parseCommands('Make the conveyor much slower.',ruleContext(findLevel('bounce')!)).error).toBeTruthy();
  });
});
