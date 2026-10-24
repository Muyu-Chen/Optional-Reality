import { ENVIRONMENT_PROPERTIES, type RuleContext, type RuleState } from '../../../shared/rules';
import type { LevelDefinition } from './types';
import { tierFor } from './progression';

export function ruleContext(level: LevelDefinition): RuleContext {
  const tier=tierFor(level);
  const context: RuleContext = {
    targets: [
      { id: 'world', kind: 'environment', label: 'World', properties: { gravity: [-10, 10], acceleration_x: [-10, 10], restitution: [0, 1.5], friction: [0, 1] }, editableProperties: [...ENVIRONMENT_PROPERTIES] },
      // Preset structural walls remain protected; active surfaces share material controls.
      ...level.tracks.map(track => ({ id: track.id, kind: 'surface', label: track.label || track.id, aliases: track.aliases, properties: { restitution: [0, 1.5] as const, friction: [0, 1] as const }, editableProperties: track.preset ? [] : ['restitution', 'friction'] as const })),
      ...(level.devices || []).flatMap<RuleContext['targets'][number]>(device => {
        switch (device.kind) {
          case 'conveyor': return [{ id: device.id, kind: device.kind, properties: { conveyor_speed: [-3, 3] as const } }];
          case 'spring': return [{ id: device.id, kind: device.kind, label: level.presentation === 'bakery' ? 'Toaster' : 'Spring', properties: { spring_power: [0, 3] as const } }];
          case 'fan': return [{ id: device.id, kind: device.kind, properties: { fan_power: [-2, 2] as const } }];
          case 'rotor': return [{ id: device.id, kind: device.kind, properties: { angular_speed: [-3, 3] as const } }];
          default: return [];
        }
      }),
    ],
    sensors: (level.devices || []).filter(device => device.kind === 'sensor').map(device => device.id),
    gates: (level.devices || []).filter(device => device.kind === 'gate').map(device => device.id),
  };
  for(const target of context.targets) {
    if(target.kind !== 'environment' && target.kind !== 'surface' && ((tier && !tier.devices.includes(target.kind)) || (level.editableDevices && !level.editableDevices.includes(target.id)))) target.editableProperties=[];
  }
  return context;
}
export function initialRules(level: LevelDefinition): RuleState {
  const state: RuleState = { gravity: level.initialGravity, values: { world: { acceleration_x: 0, restitution: level.environment?.restitution ?? 0, friction: level.environment?.friction ?? 0 } }, triggers: [] };
  for (const track of level.tracks) if (track.material) state.values[track.id] = { ...track.material };
  for (const device of level.devices || []) {
    switch (device.kind) {
      case 'conveyor': state.values[device.id] = { conveyor_speed: device.speed }; break;
      case 'spring': state.values[device.id] = { spring_power: device.power }; break;
      case 'fan': state.values[device.id] = { fan_power: device.power }; break;
      case 'rotor': state.values[device.id] = { angular_speed: device.angularSpeed }; break;
    }
  }
  return state;
}
