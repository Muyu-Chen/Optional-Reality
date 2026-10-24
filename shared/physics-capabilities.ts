// Engine-supported controls, shared by every level, the parser, UI and compiler.
// A catalog entry does not create a device or grant access to preset structures.
export const PROPERTY_NAMES = ['gravity', 'acceleration_x', 'restitution', 'friction', 'conveyor_speed', 'spring_power', 'fan_power', 'angular_speed'] as const;
export type PhysicsProperty = typeof PROPERTY_NAMES[number];
export const ENVIRONMENT_PROPERTIES = ['gravity', 'acceleration_x', 'restitution', 'friction'] as const;

interface Capability {
  label: string;
  range: readonly [number, number];
  unit: string;
  targetKinds: readonly string[];
  meaning: string;
  commandPattern: RegExp;
}
export const PHYSICS_CAPABILITIES = {
  gravity: { label: 'Gravity', range: [-10, 10], unit: 'm/s²', targetKinds: ['environment'],
    meaning: 'Vertical acceleration: positive down, negative up, zero preserves momentum. Add/enable defaults to 1.', commandPattern: /gravity|重力/ },
  acceleration_x: { label: 'Horizontal acceleration', range: [-10, 10], unit: 'm/s²', targetKinds: ['environment'],
    meaning: 'Horizontal acceleration: positive right, negative left, zero preserves momentum. Add right/left defaults to +1/-1. Vertical acceleration uses gravity.', commandPattern: /acceleration|加速度/ },
  restitution: { label: 'Surface bounce', range: [0, 1.5], unit: 'coefficient', targetKinds: ['environment', 'surface'],
    meaning: 'Collision restitution. World sets the default; a named surface overrides it.', commandPattern: /bounce|elastic|restitution|弹性/ },
  friction: { label: 'Surface friction', range: [0, 1], unit: 'coefficient', targetKinds: ['environment', 'surface'],
    meaning: 'Contact friction. World sets the default; a named surface overrides it.', commandPattern: /friction|摩擦/ },
  conveyor_speed: { label: 'Conveyor speed', range: [-3, 3], unit: 'device control', targetKinds: ['conveyor'],
    meaning: 'Signed belt drive control; zero stops the drive, negative reverses it. Not a direct actor velocity.', commandPattern: /conveyor|belt|传送带/ },
  spring_power: { label: 'Spring strength', range: [0, 3], unit: 'device control', targetKinds: ['spring'],
    meaning: 'Spring/toaster launch strength; zero disables it. Contact starts its automatic charge and release.', commandPattern: /spring|toaster|弹簧|面包机/ },
  fan_power: { label: 'Airflow', range: [-2, 2], unit: 'device control', targetKinds: ['fan'],
    meaning: 'Multiplier of the configured wind acceleration inside its area; negative reverses it, zero disables it.', commandPattern: /fan|wind|风扇/ },
  angular_speed: { label: 'Wheel speed', range: [-3, 3], unit: 'device control', targetKinds: ['rotor'],
    meaning: 'Signed rotor speed control; zero stops it, negative reverses it. Not an actor angular velocity.', commandPattern: /wheel|rotor|rotation|转轮|转盘/ },
} as const satisfies Record<PhysicsProperty, Capability>;

export function propertiesForTarget(kind: string): Partial<Record<PhysicsProperty, readonly [number, number]>> {
  return Object.fromEntries(PROPERTY_NAMES.filter(property =>
    (PHYSICS_CAPABILITIES[property].targetKinds as readonly string[]).includes(kind))
    .map(property => [property, PHYSICS_CAPABILITIES[property].range]));
}
