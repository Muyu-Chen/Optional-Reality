import type { CommandProgram, TargetReference } from './command-ast';
import type { Operation, RuleContext } from './rules';

function resolveTarget(reference: TargetReference, context?: RuleContext): string {
  if (reference.type === 'world') return 'world';
  const matches = context?.targets.filter(target => reference.type === 'device' ? target.kind === reference.kind
    : [target.id, target.label, ...(target.aliases || [])].some(name => name?.toLowerCase() === reference.name)) || [];
  if (matches.length !== 1) throw new Error('Name one unambiguous target present in this scene, or use AI preparation.');
  return matches[0].id;
}

/** Lower syntax to existing operations; keep factors relative until Send now. */
export function compileCommandTree(program: CommandProgram, context?: RuleContext): Operation[] {
  const operations: Operation[] = [];
  for (const statement of program.statements) {
    if (statement.type === 'sensor_trigger') {
      const sensors = context?.sensors || [], gates = context?.gates || [];
      if (sensors.length !== 1 || gates.length !== 1) throw new Error('Name an unambiguous sensor-to-gate condition, or use AI preparation.');
      operations.push({ type: 'add_sensor_trigger', sensor: sensors[0], gate: gates[0] });
    } else {
      const targets = [...new Set(statement.subject.targets.map(reference => resolveTarget(reference, context)))];
      for (const target of targets) {
        if (context && !context.targets.find(item => item.id === target)?.properties[statement.subject.property]) throw new Error('This property is not available on the named target. Use AI preparation to clarify the message.');
        operations.push(statement.type === 'set'
          ? { type: 'set_property', target, property: statement.subject.property, value: statement.value }
          : { type: 'scale_property', target, property: statement.subject.property, factor: statement.factor });
      }
    }
    if (operations.length > 16) throw new Error('Use at most 16 operations in one message.');
  }
  return operations;
}
