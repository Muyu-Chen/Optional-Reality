import type { Operation } from './rules';

type PropertyChange = Extract<Operation, { type: 'set_property' | 'scale_property' | 'add_property' }>;

/** Resolve relative arithmetic only against the value active at execution. */
export function requestedPropertyValue(operation: PropertyChange, previous: number | undefined): number {
  if (operation.type === 'set_property') return operation.value;
  if (previous === undefined) return NaN;
  return operation.type === 'add_property' ? previous + operation.amount : previous * operation.factor;
}
