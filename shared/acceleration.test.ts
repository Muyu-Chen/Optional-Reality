import { describe, expect, it } from 'vitest';
import { parseCommand } from './commands';
import { normalizeCommand } from './command-language';
import { levels } from '../client/src/levels/catalog';
import { gravityLab } from '../client/src/levels/gravity-lab';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { applyRules } from './rules';
import { prepareMessage } from '../client/src/domain/queue';

describe('shared physics vocabulary and conservative correction', () => {
  it.each(levels)('has the same bounded base environment in $id', level => {
    const context = ruleContext(level);
    expect(context.targets[0].editableProperties).toEqual(['gravity','acceleration_x','restitution','friction']);
    for (const text of ['add acceleration right word','add acceleration leftward','add gravity','Set surface bounce to 0.8','Set surface friction to 0.2']) {
      expect(prepareMessage('test',text,context,initialRules(level)).status,text).toBe('ready');
    }
  });
  it.each([
    ['add acceleration right word',1],['add acceleration left ward',-1],
    ['set acceleration rightward to 2 m/s²',2],['set horizontal acceleration to -2 m/s^2',-2],
    ['向左添加加速度 0.5',-.5],['stop horizontal acceleration',0],
    ['add accelaration rigth',1],
    ['横着往左拉一点吧，水平加速度设成 0.5 米每秒平方。',-.5],
    ['往右增加水平加速度 0.5',.5],
  ])('parses %s consistently', (text,value) => {
    expect(parseCommand(text).operation).toEqual({type:'set_property',target:'world',property:'acceleration_x',value});
  });
  it.each(['acceleration right and left','set acceleration to 2','add acceleration rightward -2',
    'do not add acceleration rightward','double reverse acceleration','set acceleration rightward 2 3',
    'add acceleration rightward 2 m/s','add acceleration rightward 2 for 3 seconds',
    'add acceleration to the ball rightward','reverse acceleration 2',
    '往左和往右添加水平加速度',
  ])('does not guess a conflicting, protected or incomplete instruction: %s', text => {
    expect(parseCommand(text).error).toBeDefined();
  });
  it('uses gravity for vertical acceleration without inventing a second vertical force', () => {
    expect(parseCommand('add acceleration upward').operation).toEqual({type:'set_gravity',acceleration:-1});
    expect(parseCommand('set acceleration downward to 2').operation).toEqual({type:'set_gravity',acceleration:2});
    expect(parseCommand('往上增加加速度 0.5').operation).toEqual({type:'set_gravity',acceleration:-.5});
    expect(parseCommand('往下增加加速度 0.5').operation).toEqual({type:'set_gravity',acceleration:.5});
  });
  it('preserves original input and shows a correction before execution', () => {
    const message=prepareMessage('typo','add acceleration right word',ruleContext(gravityLab),initialRules(gravityLab));
    expect(message).toMatchObject({text:'add acceleration right word',understoodAs:'add acceleration rightward',status:'ready'});
    expect(normalizeCommand('do not add acceleration right word 2')).toBe('do not add acceleration rightward 2');
    expect(normalizeCommand('set fan-main power to -1.25')).toBe('set fan-main power to -1.25');
    expect(parseCommand('stop gravtiy').operation).toEqual({type:'set_gravity',acceleration:0});
  });
  it('resolves horizontal reverse from the actual state, including old states without the new field', () => {
    const state=initialRules(gravityLab),context=ruleContext(gravityLab),op=parseCommand('reverse horizontal acceleration').operation!;
    state.values.world.acceleration_x=2;
    expect(applyRules(state,[op],context).values.world.acceleration_x).toBe(-2);
    delete state.values.world.acceleration_x;
    expect(applyRules(state,[op],context).values.world.acceleration_x).toBe(0);
  });
});
