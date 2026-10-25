import { normalizeCommand } from './command-language';
import { PHYSICS_CAPABILITIES, PROPERTY_NAMES } from './physics-capabilities';
import type { Operation, RuleContext } from './rules';

const numeric = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:e[+-]?\\d+)?';
const compact = (value: string) => value.toLowerCase().replace(/\s+/g, '').replace(/^the/, '');

/** Explicit arithmetic only. Signed assignments ("gravity = +2") stay absolute. */
export function additiveIntent(input: string): { subject: string; amount: number } | undefined {
  const text = normalizeCommand(input).trim().replace(/[。.!！]$/, '');
  let match = text.match(new RegExp(`^(.+?)\\s*([+−-])=\\s*(${numeric})$`, 'i'));
  if (match) return { subject: match[1].trim(), amount: Number(match[3]) * (match[2] === '+' ? 1 : -1) };
  match = text.match(new RegExp(`^(.+?)\\s*\\+\\s*(${numeric})$`, 'i'));
  if (match && !/(?:=|\b(?:set|to|at)\b|设为|设置|为|到)/i.test(match[1])) return { subject: match[1].trim(), amount: Number(match[2]) };
  match = text.match(new RegExp(`^(increase|decrease)\\s+(.+?)\\s+by\\s+(${numeric})$`, 'i'));
  if (match) return { subject: match[2].trim(), amount: Number(match[3]) * (match[1].toLowerCase() === 'increase' ? 1 : -1) };
  match = text.match(new RegExp(`^(.+?)(增加|加上|减少|减去)\\s*(${numeric})$`, 'i'));
  if (match) return { subject: match[1].trim(), amount: Number(match[3]) * (/减少|减去/.test(match[2]) ? -1 : 1) };
}

// This small arithmetic grammar shares the catalog and target names; unknown
// subjects go to AI instead of being silently treated as a global surface.
export function parseAdditiveCommand(input: string, context?: RuleContext): { operations: Operation[] } | { error: string } | undefined {
  const intent = additiveIntent(input);
  if (!intent) return;
  if (!Number.isFinite(intent.amount)) return { error: 'Use a finite amount for an additive change.' };
  const globals = ['', 'world', 'environment', 'global', 'global surface', 'global surfaces', 'all surfaces', 'surface', 'surfaces', 'floor', 'ground', '全局', '全局表面', '所有表面', '表面', '地面'];
  const candidates: Operation[] = [];
  for (const property of PROPERTY_NAMES) {
    const control = PHYSICS_CAPABILITIES[property];
    for (const noun of control.commandNames) {
      const names = compact(intent.subject), suffix = compact(noun);
      if (!names.endsWith(suffix)) continue;
      const scope = names.slice(0, -suffix.length).replace(/的$/, '');
      const targets = globals.some(name => compact(name) === scope) ? ['world']
        : context?.targets.filter(target => [target.id, target.label, ...(target.aliases || [])].some(name => name && compact(name) === scope)).map(target => target.id) ?? [];
      for (const target of targets) {
        const definition = context?.targets.find(item => item.id === target);
        const canonical = property === 'gravity' ? 'acceleration_y' : property;
        if (context && !definition?.properties[canonical]) continue;
        candidates.push({ type: 'add_property', target, property: canonical, amount: intent.amount });
      }
    }
  }
  const unique = [...new Map(candidates.map(operation => [JSON.stringify(operation), operation])).values()];
  return unique.length === 1 ? { operations: unique }
    : { error: 'Prepare this additive change with AI; name one existing target and property clearly.' };
}

/** Prevent a model from replacing a clear single "+2" request with "×2". */
export function checkAdditiveMeaning(input: string, operations: readonly Operation[]) {
  const intent = additiveIntent(input);
  if (intent && (operations.length !== 1 || operations[0].type !== 'add_property' || operations[0].amount !== intent.amount)) {
    throw new Error('The prepared rule changed the requested addition or subtraction. Edit or prepare this message again.');
  }
}
