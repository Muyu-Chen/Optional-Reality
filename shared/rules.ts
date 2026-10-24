import { z } from 'zod';
import { limitAbsoluteOperation, limitValue } from './rule-limits';

export const Acceleration = z.number().finite().min(-10).max(10);
export const Property = z.enum(['gravity', 'acceleration_x', 'restitution', 'friction', 'conveyor_speed', 'spring_power', 'fan_power', 'angular_speed']);
export type PropertyName = z.infer<typeof Property>;
export const ENVIRONMENT_PROPERTIES = ['gravity', 'acceleration_x', 'restitution', 'friction'] as const;
const Id = z.string().min(1).max(80);
export const OperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('set_gravity'), acceleration: z.number().finite() }).strict(),
  z.object({ type: z.literal('reverse_gravity') }).strict(),
  z.object({ type: z.literal('set_property'), target: Id, property: Property, value: z.number().finite() }).strict(),
  z.object({ type: z.literal('scale_property'), target: Id, property: Property, factor: z.number().finite() }).strict(),
  z.object({ type: z.literal('add_sensor_trigger'), sensor: Id, gate: Id }).strict(),
]);
export type Operation = z.infer<typeof OperationSchema>;
export interface RuleContext {
  targets: { id: string; kind: string; label?: string; aliases?: readonly string[]; properties: Partial<Record<PropertyName, readonly [number, number]>>; editableProperties?: readonly PropertyName[] }[];
  sensors: string[];
  gates: string[];
}
export const RuleStateSchema = z.object({
  gravity: Acceleration,
  values: z.record(Id, z.partialRecord(Property, z.number().finite().min(-100).max(100))),
  triggers: z.array(z.object({ sensor: Id, gate: Id }).strict()).max(24),
}).strict();
export type RuleState = z.infer<typeof RuleStateSchema>;
export const GRAVITY_CONTEXT: RuleContext = { targets: [{ id: 'world', kind: 'environment', properties: { gravity: [-10, 10] } }], sensors: [], gates: [] };
export const gravityState = (gravity: number): RuleState => ({ gravity, values: {}, triggers: [] });

export function propertyRange(context: RuleContext, target: string, property: PropertyName) {
  const range = context.targets.find(item => item.id === target)?.properties[property];
  if (!range) throw new Error(`The ${target}.${property} property cannot be edited in this scene. Modify the environment, not the core.`);
  return range;
}
export function checkValue(context: RuleContext, target: string, property: PropertyName, value: number) {
  const [minimum, maximum] = propertyRange(context, target, property);
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`${target}.${property} must be between ${minimum} and ${maximum}.`);
}
function checkEditable(context: RuleContext, target: string, property: PropertyName) {
  const item = context.targets.find(item => item.id === target);
  if (item?.editableProperties && !item.editableProperties.includes(property)) throw new Error(`${item.label || target}: ${property} cannot be edited in this level.`);
}
export function validateRuleState(input: unknown, context: RuleContext): RuleState {
  const state = RuleStateSchema.parse(input);
  checkValue(context, 'world', 'gravity', state.gravity);
  for (const [target, properties] of Object.entries(state.values)) {
    if (!context.targets.some(item => item.id === target)) throw new Error('Unknown environment target.');
    for (const [property, value] of Object.entries(properties)) {
      if (property === 'gravity') throw new Error('Gravity must use the top-level rule state.');
      checkValue(context, target, property as PropertyName, value!);
    }
  }
  for (const trigger of state.triggers) validateTrigger(trigger, context);
  return state;
}
function validateTrigger(trigger: { sensor: string; gate: string }, context: RuleContext) {
  if (!context.sensors.includes(trigger.sensor) || !context.gates.includes(trigger.gate)) throw new Error('Unknown sensor or gate. Gates can only be opened by a supported sensor rule.');
}
export function applyRules(current: RuleState, candidates: readonly unknown[], context: RuleContext): RuleState {
  const next = structuredClone(validateRuleState(current, context));
  for (const candidate of candidates) {
    const operation = limitAbsoluteOperation(OperationSchema.parse(candidate),context).operation;
    if (operation.type === 'add_sensor_trigger') {
      validateTrigger(operation, context);
      if (!next.triggers.some(item => item.sensor === operation.sensor && item.gate === operation.gate)) next.triggers.push({ sensor: operation.sensor, gate: operation.gate });
      continue;
    }
    if (operation.type === 'set_gravity' || operation.type === 'reverse_gravity') {
      checkEditable(context, 'world', 'gravity');
      const value = operation.type === 'set_gravity' ? operation.acceleration : -next.gravity;
      checkValue(context, 'world', 'gravity', value); next.gravity = value || 0; continue;
    }
    const { target, property } = operation;
    checkEditable(context, target, property);
    const previous = property === 'gravity' && target === 'world' ? next.gravity : next.values[target]?.[property]
      ?? (context.targets.find(item => item.id === target)?.kind === 'surface' ? next.values.world?.[property]
        : target === 'world' && property === 'acceleration_x' ? 0 : undefined);
    const requested = operation.type === 'set_property' ? operation.value : previous === undefined ? NaN : previous * operation.factor;
    const value = limitValue(requested,propertyRange(context,target,property));
    checkValue(context, target, property, value);
    if (property === 'gravity' && target === 'world') next.gravity = value || 0;
    else (next.values[target] ||= {})[property] = value || 0;
  }
  return validateRuleState(next, context);
}
