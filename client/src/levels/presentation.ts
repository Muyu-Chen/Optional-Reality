import { ruleContext } from './rules';
import type { LevelDefinition } from './types';
import type { PropertyName } from '../../../shared/rules';

const ruleNames: Record<PropertyName, string> = {
  gravity: 'Gravity', restitution: 'Surface bounce', friction: 'Surface friction',
  conveyor_speed: 'Conveyor speed', spring_power: 'Toaster power',
  fan_power: 'Airflow', angular_speed: 'Wheel speed',
};

export function editableRuleLabels(level: LevelDefinition): string[] {
  const context = ruleContext(level);
  const world = context.targets.find(target=>target.id==='world');
  const labels = context.targets.flatMap(target =>
    (target.editableProperties ?? Object.keys(target.properties) as PropertyName[])
      .map(property => target.kind==='surface' && !world?.editableProperties?.includes(property)
        ? `${target.label || 'Surface'} ${property==='restitution'?'bounce':'friction'}`
        : property === 'spring_power' && level.presentation !== 'bakery' ? 'Spring strength' : ruleNames[property]));
  if (context.sensors.length && context.gates.length) labels.push('Touch switch → gate');
  return [...new Set(labels)];
}
