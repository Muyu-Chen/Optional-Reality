import { describe, expect, it } from 'vitest';
import { applyRules, validateRuleState, type Operation } from './rules';
import { validateCompilation } from './compiler';
import { limitAbsoluteOperation } from './rule-limits';
import { realityBreakdown } from '../client/src/levels/reality-breakdown';
import { toaster } from '../client/src/levels/toaster';
import { initialRules,ruleContext } from '../client/src/levels/rules';
import { prepareMessage } from '../client/src/domain/queue';

const context=ruleContext(realityBreakdown);
describe('deterministic rule limits',()=>{
  it.each([
    ['Set fan power to 10',2],['Set fan power to -10',-2],['Set fan power to 1.25',1.25],
    ['Set spring power to -5',0],['Set surface friction to 10',1],['Set surface bounce to -5',0],
    ['Set gravity to 999',100],['Set gravity to -999',-100],['add acceleration right word 999',100],
  ])('prepares %s using the permitted bound %s', (text,value)=>{
    const message=prepareMessage('id',text,context,initialRules(realityBreakdown));
    expect(message.status).toBe('ready');
    const op=message.operation!;
    expect(op.type === 'set_gravity' ? op.acceleration : op.type === 'set_property' ? op.value : NaN).toBe(value);
    expect(!!message.adjustments?.length).toBe(!text.includes('1.25'));
  });
  it('clamps model output in code and reports the original request without mutating the request',()=>{
    const request={requestId:'r',levelId:realityBreakdown.id,sceneVersion:1,queueRevision:1,messages:[{id:'m',text:'Set fan power to 10'}],rules:initialRules(realityBreakdown)};
    const before=structuredClone(request);
    const response=validateCompilation(request,{messages:[{id:'m',operations:[{type:'set_property',target:'fan-main',property:'fan_power',value:10}],error:null}]},context);
    expect(response.messages[0]).toMatchObject({operations:[{value:2}],adjustments:[{requested:10,applied:2,minimum:-2,maximum:2}]});
    expect(request).toEqual(before);
  });
  it.each([NaN,Infinity,-Infinity])('rejects nonfinite values instead of turning them into valid controls: %s',value=>{
    expect(()=>applyRules(initialRules(realityBreakdown),[{type:'set_property',target:'fan-main',property:'fan_power',value}],context)).toThrow();
    expect(()=>limitAbsoluteOperation({type:'set_gravity',acceleration:value},context)).toThrow();
  });
  it.each(['missing','energy-core'])('never fixes an unknown/protected target by bounding it: %s',target=>{
    expect(()=>applyRules(initialRules(realityBreakdown),[{type:'set_property',target,property:'fan_power',value:10}],context)).toThrow();
  });
  it('never makes a read-only device editable',()=>{
    const state=initialRules(toaster),before=structuredClone(state);
    expect(()=>applyRules(state,[{type:'set_property',target:'belt-main',property:'conveyor_speed',value:10}],ruleContext(toaster))).toThrow('cannot be edited');
    expect(state).toEqual(before);
  });
  it('clips relative results at execution without rewriting the relative rule',()=>{
    const state=initialRules(realityBreakdown);state.values['fan-main'].fan_power=1.5;
    const relative:Operation={type:'scale_property',target:'fan-main',property:'fan_power',factor:2};
    expect(limitAbsoluteOperation(relative,context).operation).toEqual(relative);
    expect(applyRules(state,[relative],context).values['fan-main'].fan_power).toBe(2);
    state.values['fan-main'].fan_power=-1.5;
    expect(applyRules(state,[relative],context).values['fan-main'].fan_power).toBe(-2);
    expect(state.values['fan-main'].fan_power).toBe(-1.5);
  });
  it('keeps invalid stored state strict and rejects a partly invalid batch atomically',()=>{
    const state=initialRules(realityBreakdown),before=structuredClone(state);
    expect(()=>applyRules(state,[{type:'set_property',target:'fan-main',property:'fan_power',value:10},{type:'set_property',target:'energy-core',property:'friction',value:999}],context)).toThrow();
    expect(state).toEqual(before);
    state.values['fan-main'].fan_power=10;
    expect(()=>validateRuleState(state,context)).toThrow();
  });
  it('fails atomically if finite arithmetic overflows before limiting',()=>{
    const state=initialRules(realityBreakdown);state.values['fan-main'].fan_power=2;
    const before=structuredClone(state);
    expect(()=>applyRules(state,[{type:'set_gravity',acceleration:5},{type:'scale_property',target:'fan-main',property:'fan_power',factor:1e308}],context)).toThrow('finite');
    expect(state).toEqual(before);
  });
});
