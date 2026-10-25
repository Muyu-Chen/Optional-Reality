import type { Operation, PropertyName, RuleContext } from './rules';
import { normalizeAccelerationOperation } from './acceleration';

export interface RuleAdjustment {
  target: string; property: PropertyName; requested: number; applied: number;
  minimum: number; maximum: number;
}

export function limitValue(value: number, range: readonly [number, number]) {
  if (!Number.isFinite(value)) throw new Error('Rule values must be finite numbers.');
  return Math.max(range[0], Math.min(range[1], value)) || 0;
}

// Absolute values are bounded before queueing. Relative rules remain relative;
// the executor limits their resolved result against the same scene ranges.
export function limitAbsoluteOperation(operation: Operation, context: RuleContext): { operation: Operation; adjustment?: RuleAdjustment } {
  operation = normalizeAccelerationOperation(operation);
  if (operation.type !== 'set_property' && operation.type !== 'scale_property' && operation.type !== 'add_property') return { operation };
  const {target,property} = operation;
  const definition = context.targets.find(item => item.id === target);
  const range = definition?.properties[property];
  if (!range) throw new Error(`The ${target}.${property} property cannot be edited in this scene. Modify the environment, not the core.`);
  if (definition.editableProperties && !definition.editableProperties.includes(property)) throw new Error(`${definition.label || target}: ${property} cannot be edited in this level.`);
  // Relative values stay unresolved, but their target permissions are already
  // known, even when preparation has no current rule snapshot.
  if (operation.type === 'scale_property' || operation.type === 'add_property') return { operation };
  const requested = operation.value;
  const applied = limitValue(requested, range);
  const bounded = { ...operation, value: applied };
  return { operation: bounded, ...(requested !== applied ? { adjustment: { target, property, requested, applied, minimum: range[0], maximum: range[1] } } : {}) };
}

export function limitAbsoluteOperations(input: readonly Operation[], context: RuleContext) {
  const limited = input.map(operation => limitAbsoluteOperation(operation,context));
  return { operations:limited.map(item => item.operation),adjustments:limited.flatMap(item => item.adjustment ? [item.adjustment] : []) };
}
