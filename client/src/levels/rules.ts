import type { RuleContext, RuleState } from '../../../shared/rules';
import type { LevelDefinition } from './types';

export function ruleContext(level: LevelDefinition): RuleContext {
  return {
    targets: [
      { id: 'world', kind: 'environment', properties: { gravity: [-10, 10], restitution: [0, 1.5], friction: [0, 1] } },
      ...level.tracks.map(track => ({ id: track.id, kind: 'surface', properties: { restitution: [0, 1.5] as const, friction: [0, 1] as const } })),
      ...(level.devices || []).flatMap<RuleContext['targets'][number]>(device => {
        switch (device.kind) {
          case 'conveyor': return [{ id: device.id, kind: device.kind, properties: { conveyor_speed: [-3, 3] as const } }];
          case 'spring': return [{ id: device.id, kind: device.kind, properties: { spring_power: [0, 3] as const } }];
          case 'fan': return [{ id: device.id, kind: device.kind, properties: { fan_power: [-2, 2] as const } }];
          case 'rotor': return [{ id: device.id, kind: device.kind, properties: { angular_speed: [-3, 3] as const } }];
          default: return [];
        }
      }),
    ],
    sensors: (level.devices || []).filter(device => device.kind === 'sensor').map(device => device.id),
    gates: (level.devices || []).filter(device => device.kind === 'gate').map(device => device.id),
  };
}
export function initialRules(level: LevelDefinition): RuleState {
  const state: RuleState = { gravity: level.initialGravity, values: { world: { restitution: level.environment?.restitution ?? 0, friction: level.environment?.friction ?? 0 } }, triggers: [] };
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
