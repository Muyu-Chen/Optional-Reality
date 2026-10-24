import { Acceleration, OperationSchema, type Operation, type RuleContext } from './rules';
import { surfaceTarget } from './surface-target';
import { normalizeCommand } from './command-language';
import { parseAcceleration } from './acceleration-command';
export { Acceleration, OperationSchema, type Operation } from './rules';
export type ParsedCommand = { operation: Operation; error?: never } | { operation?: never; error: string };

export function parseCommand(input: string, context?: RuleContext): ParsedCommand {
  input = normalizeCommand(input);
  const text = input.trim().toLowerCase().replace(/[“”"'.!?。！]/g, '').replace(/\s+/g, ' ');
  const raw = input.trim().toLowerCase().replace(/'s\b/g, '').replace(/[“”"']/g, '').replace(/[.!?。！]+$/g, '');
  const device = (kind: string) => context?.targets.find(target => target.kind === kind)?.id;
  if (/\band\b|\bthen\b|\bfor\b.*\b(seconds?|minutes?)\b|\d\s*[eE][+-]?\d|同时|并且|然后/.test(raw)) return { error: 'Use AI preparation for combined or timed instructions; the local parser handles one direct operation.' };
  if (/^when (the )?(energy )?(core|ball|bread|loaf) (touches|hits) (the )?(sensor|bell),? open (the )?(gate|shutter)$/.test(raw) || /^当.*(触|碰).*(传感器|感应器|铃).*开.*(门|卷帘)$/.test(raw)) {
    if (!context?.sensors[0] || !context.gates[0]) return { error: 'This scene has no sensor-to-gate condition.' };
    return { operation: { type: 'add_sensor_trigger', sensor: context.sensors[0], gate: context.gates[0] } };
  }
  if (/\b(core|ball|bread|loaf|block|slider|cube)\b|teleport|小球|能量球|滑块|面包(?!机)/.test(text)) return { error: 'Modify the environment, not the core.' };
  if (/^(add|enable|turn on)( the)? gravity$/.test(text) || text === '加重力') return { operation: { type: 'set_gravity', acceleration: 1 } };
  if (/^(stop|disable|remove|turn off)( the)? gravity$/.test(text) || /^(no gravity|gravity\s*=\s*0)$/.test(text) || text === '停止重力') return { operation: { type: 'set_gravity', acceleration: 0 } };
  if (/^reverse( the)? gravity$/.test(text) || text === '反转重力') return { operation: { type: 'reverse_gravity' } };
  if (/\bwhen\b|\bif\b|当|如果/.test(text)) return { error: 'Only the sensor-to-gate condition is supported. Send other rules manually.' };
  const number = raw.match(/-?(?:\d+(?:\.\d+)?|\.\d+)/);
  const value = number ? Number(number[0]) : undefined;
  const acceleration = parseAcceleration(raw);
  if (acceleration) return acceleration;
  if (/gravity|重力/.test(text) && value !== undefined) return { operation: { type: 'set_gravity', acceleration: /upward|向上/.test(text) ? -Math.abs(value) : value } };
  const options = [
    [/conveyor|belt|传送带/, 'conveyor_speed', device('conveyor')],
    [/spring|toaster|弹簧|面包机/, 'spring_power', device('spring')],
    [/fan|wind|风扇/, 'fan_power', device('fan')],
    [/wheel|rotor|rotation|转轮|转盘/, 'angular_speed', device('rotor')],
    [/bounce|elastic|restitution|弹性/, 'restitution', 'world'],
    [/friction|摩擦/, 'friction', 'world'],
  ] as const;
  for (const [pattern, property, defaultTarget] of options) {
    if (!pattern.test(text)) continue;
    const resolved = property === 'restitution' || property === 'friction' ? surfaceTarget(raw, context) : { target: defaultTarget };
    if ('error' in resolved && resolved.error) return { error: resolved.error };
    const target = resolved.target;
    if (!target) return { error: 'This device is not present in the current scene.' };
    if (/reverse|反转/.test(text)) return { operation: { type: 'scale_property', target, property, factor: -1 } };
    const amount = /stop|off|关闭|停止/.test(text) ? 0 : value;
    if (amount === undefined) return { error: 'Include a number, or use AI preparation for free-form language.' };
    return { operation: { type: 'set_property', target, property, value: /counterclockwise|anticlockwise|逆时针/.test(text) ? -Math.abs(amount) : amount } };
  }
  return { error: 'Use a supported numeric environment command, or prepare this message with AI.' };
}

export function applyOperation(current: number, candidate: unknown): number {
  Acceleration.parse(current);
  const operation = OperationSchema.parse(candidate);
  if (operation.type !== 'set_gravity' && operation.type !== 'reverse_gravity') throw new Error('This operation requires the scene rule context.');
  const next = operation.type === 'set_gravity' ? operation.acceleration : -current;
  return Object.is(next, -0) ? 0 : next;
}
export function describeOperation(operation: Operation): { title: string; detail: string } {
  if (operation.type === 'reverse_gravity') return { title: 'Reverse gravity', detail: 'Invert the gravity that is active when sent.' };
  if (operation.type === 'add_sensor_trigger') return { title: 'Sensor → gate', detail: `${operation.sensor} contact opens ${operation.gate}.` };
  if (operation.type === 'scale_property') return { title: `${operation.property.replaceAll('_', ' ')} × ${operation.factor}`, detail: `Read ${operation.target} at execution time.` };
  if (operation.type === 'set_property') return { title: operation.property === 'acceleration_x' ? operation.value === 0 ? 'Horizontal acceleration = 0' : `Acceleration ${operation.value > 0 ? '→' : '←'} ${Math.abs(operation.value)} m/s²` : `${operation.property.replaceAll('_', ' ')} = ${operation.value}`, detail: `Target: ${operation.target}.` };
  if (operation.acceleration === 0) return { title: 'gravity = 0', detail: 'No gravitational acceleration.' };
  return { title: `Gravity ${operation.acceleration > 0 ? '↓' : '↑'}`, detail: `${operation.acceleration > 0 ? 'Downward' : 'Upward'} · a = ${Math.abs(operation.acceleration)} m/s²` };
}
