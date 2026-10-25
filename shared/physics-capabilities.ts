// Engine-supported controls, shared by every level, the parser, UI and compiler.
// A catalog entry does not create a device or grant access to preset structures.
import { ACCELERATION_RANGE } from './acceleration';
export const PROPERTY_NAMES = ['gravity', 'acceleration_x', 'acceleration_y', 'restitution', 'friction', 'conveyor_speed', 'spring_power', 'fan_power', 'angular_speed'] as const;
export type PhysicsProperty = typeof PROPERTY_NAMES[number];
export const ENVIRONMENT_PROPERTIES = ['acceleration_x', 'acceleration_y', 'restitution', 'friction'] as const;

interface Capability {
  label: string;
  range: readonly [number, number];
  unit: string;
  targetKinds: readonly string[];
  meaning: string;
  commandNames: readonly string[];
}
export const PHYSICS_CAPABILITIES = {
  gravity: { label: 'Acceleration', range: ACCELERATION_RANGE, unit: 'm/s²', targetKinds: [],
    meaning: 'Legacy input alias for acceleration_y. Never a separate force or state parameter.', commandNames: ['gravity', '重力'] },
  acceleration_x: { label: 'Acceleration', range: ACCELERATION_RANGE, unit: 'm/s²', targetKinds: ['environment'],
    meaning: 'x component of the single environment acceleration vector: positive right, negative left. Preserve y when editing x. Add defaults to magnitude 1.', commandNames: ['horizontal acceleration', 'acceleration_x', '水平加速度'] },
  acceleration_y: { label: 'Acceleration', range: ACCELERATION_RANGE, unit: 'm/s²', targetKinds: ['environment'],
    meaning: 'y component of the same acceleration vector: positive down, negative up. Gravity is an alias. Preserve x when editing y; replace this component rather than adding a second force. Add defaults to magnitude 1.', commandNames: ['vertical acceleration', 'acceleration_y', '竖直加速度', '垂直加速度', 'gravity', '重力'] },
  restitution: { label: 'Surface bounce', range: [0, 1.5], unit: 'coefficient', targetKinds: ['environment', 'surface'],
    meaning: 'Collision restitution. World sets the default; a named surface overrides it.', commandNames: ['restitution', 'bounce', 'bounciness', 'elasticity', '弹性系数', '弹性', '弹力'] },
  friction: { label: 'Surface friction', range: [0, 1], unit: 'coefficient', targetKinds: ['environment', 'surface'],
    meaning: 'Contact friction. World sets the default; a named surface overrides it.', commandNames: ['friction', '摩擦系数', '摩擦'] },
  conveyor_speed: { label: 'Conveyor speed', range: [-3, 3], unit: 'device control', targetKinds: ['conveyor'],
    meaning: 'Signed belt drive control; zero stops the drive, negative reverses it. Not a direct actor velocity.', commandNames: ['conveyor', 'belt', '传送带'] },
  spring_power: { label: 'Spring strength', range: [0, 3], unit: 'device control', targetKinds: ['spring'],
    meaning: 'Spring strength; zero disables it. Passive elastic springs use contact restoring force; powered toasters use automatic charge and release.', commandNames: ['spring', 'toaster', '弹簧', '面包机'] },
  fan_power: { label: 'Airflow', range: [-2, 2], unit: 'device control', targetKinds: ['fan'],
    meaning: 'Multiplier of the configured wind acceleration inside its area; negative reverses it, zero disables it.', commandNames: ['fan', 'wind', '风扇'] },
  angular_speed: { label: 'Wheel speed', range: [-3, 3], unit: 'device control', targetKinds: ['rotor'],
    meaning: 'Signed rotor speed control; zero stops it, negative reverses it. Not an actor angular velocity.', commandNames: ['wheel', 'rotor', 'rotation', '转轮', '转盘'] },
} as const satisfies Record<PhysicsProperty, Capability>;

export function propertiesForTarget(kind: string): Partial<Record<PhysicsProperty, readonly [number, number]>> {
  return Object.fromEntries(PROPERTY_NAMES.filter(property =>
    (PHYSICS_CAPABILITIES[property].targetKinds as readonly string[]).includes(kind))
    .map(property => [property, PHYSICS_CAPABILITIES[property].range]));
}
