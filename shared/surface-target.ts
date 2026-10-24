import type { RuleContext } from './rules';

const escapePattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const directCommand = (text: string) => /^(?:(?:set|change|reverse|stop|turn off|increase|decrease|reduce)(?: the)?\s+)?(?:(?:all\s+)?(?:surfaces?|floor|ground)\s+)?(?:bounce|bounciness|elasticity|restitution|friction)(?:\s*(?:=|to|at|by)?\s*-?(?:\d*\.\d+|\d+))?$/.test(text)
  || /^(?:设置|反转|停止|关闭|增大|降低)?(?:地面|表面|surface)?的?(?:弹性|摩擦)(?:系数)?(?:为|到|=)?\s*-?(?:\d*\.\d+|\d+)?$/.test(text);

// Unknown names must never silently become global edits.
export function surfaceTarget(input: string, context?: RuleContext): { target: string; error?: never } | { target?: never; error: string } {
  const text = input.replace(/'s\b/g, '').trim();
  const matches = context?.targets.filter(target => target.kind === 'surface' &&
    [target.id, target.label, ...(target.aliases || [])].some(name => {
      if (!name) return false;
      const pattern = /[\u3400-\u9fff]/u.test(name) ? escapePattern(name)
        : `(?<![\\p{L}\\p{N}])${escapePattern(name.toLowerCase())}(?![\\p{L}\\p{N}])`;
      const match = new RegExp(pattern,'u');
      return match.test(text) && directCommand(text.replace(match,'surface'));
    })) || [];
  if (matches.length > 1) return { error: 'Name one surface per message, or use AI preparation.' };
  if (matches.length === 1) return { target: matches[0].id };
  return directCommand(text) ? { target: 'world' } : { error: 'Name a surface shown in this level, or use AI preparation.' };
}
