import { ruleContext } from './rules';
import type { LevelDefinition } from './types';
import type { PropertyName } from '../../../shared/rules';
import { PHYSICS_CAPABILITIES } from '../../../shared/physics-capabilities';

export function editableRuleLabels(level: LevelDefinition): string[] {
  const context = ruleContext(level);
  const world = context.targets.find(target=>target.id==='world');
  const labels = context.targets.flatMap(target =>
    (target.editableProperties ?? Object.keys(target.properties) as PropertyName[])
      .map(property => target.kind==='surface' && (!world?.editableProperties?.includes(property) || level.tracks.find(track=>track.id===target.id)?.material?.[property as 'restitution'|'friction'] !== undefined)
        ? `${target.label || 'Surface'} ${property==='restitution'?'bounce':'friction'}`
        : property === 'spring_power' && level.presentation === 'bakery' ? 'Toaster power' : PHYSICS_CAPABILITIES[property].label));
  if (context.sensors.length && context.gates.length) labels.push('Touch switch → gate');
  return [...new Set(labels)];
}
