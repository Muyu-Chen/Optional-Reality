import { applyRules, gravityState, GRAVITY_CONTEXT, OperationSchema, type Operation, type RuleContext } from './rules';
import { surfaceTarget } from './surface-target';
import { normalizeCommand } from './command-language';
import { parseAcceleration } from './acceleration-command';
import { PHYSICS_CAPABILITIES } from './physics-capabilities';
import { normalizeAccelerationOperation } from './acceleration';
import { parseAdditiveCommand } from './additive-command';
export { Acceleration, OperationSchema, type Operation } from './rules';
export type ParsedCommand = { operation: Operation; error?: never } | { operation?: never; error: string };

export function parseCommand(input: string, context?: RuleContext): ParsedCommand {
  const additive = parseAdditiveCommand(input, context);
  if (additive) return 'operations' in additive ? { operation: additive.operations[0] } : additive;
  const parsed = parseInput(input,context);
  return parsed.operation ? {operation:normalizeAccelerationOperation(parsed.operation)} : parsed;
}
function parseInput(input: string, context?: RuleContext): ParsedCommand {
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
    ['conveyor_speed', device('conveyor')],
    ['spring_power', device('spring')],
    ['fan_power', device('fan')],
    ['angular_speed', device('rotor')],
    ['restitution', 'world'],
    ['friction', 'world'],
  ] as const;
  for (const [property, defaultTarget] of options) {
    const pattern = PHYSICS_CAPABILITIES[property].commandPattern;
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
  const operation = OperationSchema.parse(candidate);
  const normalized = normalizeAccelerationOperation(operation);
  if (normalized.type === 'add_sensor_trigger' || normalized.target !== 'world' || normalized.property !== 'acceleration_y') throw new Error('This operation requires the scene rule context.');
  return applyRules(gravityState(current),[operation],GRAVITY_CONTEXT).acceleration.y;
}
export function describeOperation(operation: Operation): { title: string; detail: string } {
  if (operation.type === 'add_property') return {
    title: `${operation.property.replaceAll('_', ' ')} ${operation.amount < 0 ? '−' : '+'} ${Math.abs(operation.amount)}`,
    detail: `Add to ${operation.target} at execution time.`,
  };
  if (operation.type === 'reverse_gravity') return { title: 'Reverse gravity', detail: 'Invert the gravity that is active when sent.' };
  if (operation.type === 'add_sensor_trigger') return { title: 'Sensor → gate', detail: `${operation.sensor} contact opens ${operation.gate}.` };
  if (operation.type === 'scale_property') {
    const axis=operation.property === 'acceleration_x' ? 'horizontal' : operation.property === 'acceleration_y' || operation.property === 'gravity' ? 'vertical' : undefined;
    const change=operation.factor===-1 ? 'Reverse' : operation.factor===2 ? 'Double' : operation.factor===.5 ? 'Halve' : undefined;
    return { title: axis && change ? `${change} ${axis} acceleration` : `${operation.property.replaceAll('_', ' ')} × ${operation.factor}`, detail: `Read ${operation.target} at execution time.` };
  }
  if (operation.type === 'set_property') {
    const axis = operation.property === 'acceleration_x' ? 'x' : operation.property === 'acceleration_y' ? 'y' : undefined;
    return { title: axis ? operation.value === 0 ? `Acceleration ${axis} = 0` : `Acceleration ${axis === 'x' ? operation.value > 0 ? '→' : '←' : operation.value > 0 ? '↓' : '↑'} ${Math.abs(operation.value)} m/s²` : `${operation.property.replaceAll('_', ' ')} = ${operation.value}`, detail: `Target: ${operation.target}.` };
  }
  if (operation.acceleration === 0) return { title: 'gravity = 0', detail: 'No gravitational acceleration.' };
  return { title: `Gravity ${operation.acceleration > 0 ? '↓' : '↑'}`, detail: `${operation.acceleration > 0 ? 'Downward' : 'Upward'} · a = ${Math.abs(operation.acceleration)} m/s²` };
}
