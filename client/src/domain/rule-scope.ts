import { describeOperation } from '../../../shared/commands';
import { normalizeAccelerationOperation, accelerationAxis } from '../../../shared/acceleration';
import type { Operation } from '../../../shared/rules';
import type { LevelDefinition } from '../levels/types';
import { ruleContext } from '../levels/rules';

/** Scope belongs in the summary: identical numbers can change different surfaces. */
export function scopedRulePreview(operations: readonly Operation[], level: LevelDefinition) {
  const context = ruleContext(level);
  const descriptions = operations.map(input => {
    const operation = normalizeAccelerationOperation(input);
    const description = describeOperation(input).title;
    if (operation.type === 'add_sensor_trigger' || accelerationAxis(operation.property)) return description;
    const { target } = operation;
    const label = target === 'world' ? 'All surfaces' : context.targets.find(item => item.id === target)?.label || target;
    return `${label} · ${description}`;
  });
  return descriptions.join(' · ');
}
