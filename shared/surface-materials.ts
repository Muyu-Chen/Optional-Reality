import type { Operation, RuleContext, RuleState } from './rules';
import { requestedPropertyValue } from './property-change';
import { limitValue } from './rule-limits';

/** A general material command reaches every editable surface. Named commands
 * remain local; preset structures retain their level-defined material.
 */
export function applyGlobalSurfaceMaterial(state: RuleState, operation: Operation, context: RuleContext) {
  if (!('target' in operation) || operation.target !== 'world'
    || !('property' in operation) || !['restitution', 'friction'].includes(operation.property)) return;
  for (const target of context.targets) {
    if (target.kind !== 'surface' || (target.editableProperties && !target.editableProperties.includes(operation.property))) continue;
    const range = target.properties[operation.property];
    const previous = state.values[target.id]?.[operation.property];
    // Inherited surfaces already follow world; update only explicit local values.
    if (!range || previous === undefined) continue;
    state.values[target.id][operation.property] = limitValue(requestedPropertyValue(operation, previous), range);
  }
}
