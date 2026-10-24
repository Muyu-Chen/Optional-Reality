import { describe, expect, it } from 'vitest';
import { bounce } from '../levels/bounce';
import { initialRules, ruleContext } from '../levels/rules';
import { applyRules, validateRuleState } from '../../../shared/rules';
import { PhysicsWorld } from './world';

const level={...bounce,tracks:[
  {id:'pad',label:'Launch pad',aliases:['pad'],points:[[40,420],[350,420]] as const,thickness:12,material:{restitution:.2}},
  {id:'wall',points:[[700,100],[700,420]] as const,thickness:12,material:{restitution:0,friction:.3},preset:true},
]};

describe('independent surface materials', () => {
  it('validates preset materials separately from player permissions', () => {
    const state=initialRules(level), context=ruleContext(level);
    expect(()=>validateRuleState(state,context)).not.toThrow();
    expect(context.targets.find(target=>target.id==='pad')).toMatchObject({label:'Launch pad',aliases:['pad'],editableProperties:['restitution','friction']});
    expect(()=>applyRules(state,[{type:'set_property',target:'wall',property:'restitution',value:.9}],context)).toThrow('cannot be edited');
  });
  it('only changes the chosen surface and restores its material on undo', () => {
    const world=new PhysicsWorld(level);
    try {
      world.applyMessages([{text:'bounce',operations:[{type:'set_property',target:'pad',property:'restitution',value:.9}]}]);
      const bodies=world.engine.world.bodies;
      expect(bodies.filter(body=>body.label==='pad').every(body=>body.restitution===.9)).toBe(true);
      expect(bodies.filter(body=>body.label==='wall').every(body=>body.restitution===0&&body.friction===.3)).toBe(true);
      world.undoRule();expect(world.rules.values.pad.restitution).toBe(.2);
      expect(bodies.filter(body=>body.label==='pad').every(body=>body.restitution===.2)).toBe(true);
    } finally {world.destroy();}
  });
  it('constructs an actual rotation-constrained box without changing the protected actor definition', () => {
    const definition={...bounce,ball:{...bounce.ball,shape:{kind:'box' as const,width:40,height:24}}};
    const before=structuredClone(definition), world=new PhysicsWorld(definition);
    try {
      expect(world.ball.circleRadius).toBe(0);expect(world.ball.inertia).toBe(Infinity);
      expect(world.ball.bounds.max.x-world.ball.bounds.min.x).toBeCloseTo(40);
      expect(world.ball.bounds.max.y-world.ball.bounds.min.y).toBeCloseTo(24);
      expect(definition).toEqual(before);
      expect(ruleContext(definition).targets.some(target=>target.id===definition.ball.id)).toBe(false);
    } finally {world.destroy();}
  });
});
