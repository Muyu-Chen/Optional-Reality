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

/** Prefer intuitive wording in the composer; exact values remain in the queue. */
export function naturalRuleExample(level:LevelDefinition) {
  if(['bounce','multi-bounce','catch-cup','bank-shot','one-last-bounce'].includes(level.id))return 'Make all surfaces almost perfectly bouncy';
  if(level.id==='return-to-dock')return 'Make the return wall very bouncy';
  if(level.id==='bring-it-back')return 'Give the world a gentle leftward acceleration';
  if(level.id==='side-door')return 'Give the world a gentle rightward acceleration';
  if(level.id==='friction-runway')return 'Make the surface grippy';
  if(level.id==='reality-breakdown')return 'Make the conveyor much slower';
  return 'Give the ball a gentle upward acceleration';
}
