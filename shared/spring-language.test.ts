import { describe, expect, it } from 'vitest';
import { parseCommands } from './commands';
import { applyRules } from './rules';
import { messageOperations, prepareMessage } from '../client/src/domain/queue';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { toaster } from '../client/src/levels/toaster';
import { gravityLab } from '../client/src/levels/gravity-lab';
import { breeze } from '../client/src/levels/breeze';

const context=ruleContext(toaster),initial=()=>initialRules(toaster);
const add=(amount:number)=>[{type:'add_property',target:'spring-main',property:'spring_power',amount}];

describe('device-scoped spring language',()=>{
  it.each(['toaster增加弹性','toaster增加弹力','面包机增加弹性','spring-main增加弹力','把toaster的弹性增加一点',
    'increase toaster elasticity',"increase the toaster's elasticity",'make the toaster bouncier'])('prepares %s locally and shows its concrete device interpretation',text=>{
    const before=initial(),message=prepareMessage('m',text,context,before);
    expect(message).toMatchObject({status:'ready',source:'local',understoodAs:expect.stringContaining('Toaster: Spring strength + 1')});
    expect(messageOperations(message)).toEqual(add(1));
    expect(before).toEqual(initial());
  });
  it.each([
    ['toaster弹性增加0.5',.5],['toaster增加弹性0.25',.25],['increase toaster elasticity by 0.2',.2],
    ['toaster弹力减少0.5',-.5],['decrease toaster strength',-1],
  ] as const)('preserves an explicit change for %s', (text,amount)=>{
    expect(parseCommands(text,context).operations).toEqual(add(amount));
  });
  it('reads strength at execution, clamps to the device range, and leaves collision properties alone',()=>{
    const parsed=parseCommands('toaster增加弹性',context),before=initial();before.values['spring-main'].spring_power=2.5;
    const after=applyRules(before,parsed.operations!,context);
    expect(after.values['spring-main'].spring_power).toBe(3);
    expect(after.values.world).toEqual(before.values.world);
    expect(after.values['belt-main']).toEqual(before.values['belt-main']);
    expect(after.values['fan-main']).toEqual(before.values['fan-main']);
    expect(before.values['spring-main'].spring_power).toBe(2.5);
  });
  it('also understands explicit assignments and doubling without changing generic surface language',()=>{
    expect(parseCommands('Set toaster elasticity to 2',context).operations).toEqual([{type:'set_property',target:'spring-main',property:'spring_power',value:2}]);
    expect(parseCommands('toaster弹力翻倍',context).operations).toEqual([{type:'scale_property',target:'spring-main',property:'spring_power',factor:2}]);
    expect(parseCommands('弹力增加0.5',context).operations).toEqual([{type:'add_property',target:'world',property:'restitution',amount:.5}]);
  });
  it('keeps missing, ambiguous and preset devices protected',()=>{
    expect(prepareMessage('m','toaster增加弹性',ruleContext(gravityLab),initialRules(gravityLab)).status).toBe('error');
    const ambiguous={...context,targets:[...context.targets,{id:'second-spring',kind:'spring',properties:{spring_power:[0,3] as const}}]};
    expect(prepareMessage('m','弹簧增加弹性',ambiguous,initial()).status).toBe('error');
    expect(prepareMessage('m','toaster增加弹性',ruleContext(breeze),initialRules(breeze)).status).toBe('error');
    expect(prepareMessage('m','imaginary toaster增加弹性',context,initial()).status).toBe('error');
  });
  it.each(['不要toaster增加弹性','toaster增加弹性并瞬移面包','toaster增加弹性 5 N','toaster弹性系数增加0.5','toaster增加弹性1e999'])('does not accept a misleading prefix or convert a different quantity: %s',text=>{
    const message=prepareMessage('m',text,context,initial());
    expect(message.status).toBe('error');expect(messageOperations(message)).toEqual([]);
  });
});
