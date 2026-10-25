import { applyRules, gravityState, GRAVITY_CONTEXT, OperationSchema, type Operation, type RuleContext } from './rules';
import { parseCommandTree } from './command-parser';
import { compileCommandTree } from './command-compiler';
import { normalizeAccelerationOperation } from './acceleration';
import { qualitativeProgram } from './qualitative-commands';
import { parseAdditiveCommand } from './additive-command';
import { springLanguageCommand } from './spring-language';
export { Acceleration, OperationSchema, type Operation } from './rules';
export type ParsedCommand = { operation: Operation; error?: never } | { operation?: never; error: string };
export type ParsedCommands = { operations: Operation[]; understoodAs?: string; error?: never } | { operations?: never; error: string };

export function parseCommands(input: string, context?: RuleContext): ParsedCommands {
  try {
    const spring = springLanguageCommand(input,context);
    if(spring)return spring;
    const additive = parseAdditiveCommand(input, context);
    if (additive) return additive;
    const qualitative = qualitativeProgram(input, context);
    if (qualitative) {
      const operations = compileCommandTree(qualitative, context);
      return { operations, understoodAs: operations.map(operation => { const result = describeOperation(operation); const target = 'target' in operation ? operation.target : undefined; const label = context?.targets.find(item => item.id === target)?.label || (target === 'world' ? 'World' : target); return `${result.title}. ${target ? `Target: ${label}.` : result.detail}`; }).join(' ') };
    }
    return { operations: compileCommandTree(parseCommandTree(input, context), context) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Use AI preparation for this message.' };
  }
}

// Compatibility for callers expecting exactly one operation. Queue preparation
// uses parseCommands so one player message can contain a complete program.
export function parseCommand(input: string, context?: RuleContext): ParsedCommand {
  const parsed = parseCommands(input, context);
  if (!parsed.operations) return { error: parsed.error };
  return parsed.operations.length === 1 ? { operation: parsed.operations[0] }
    : { error: 'This message contains multiple operations; use parseCommands.' };
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
