import type { ParsedCommand } from './commands';

// Vertical acceleration is gravity; horizontal acceleration is a separate axis.
export function parseAcceleration(text: string): ParsedCommand | undefined {
  if (!/\bacceleration\b|加速度/.test(text)) return;
  if (/\b(?:not|never|dont|don't|without|unless|except)\b|不要|不能|除了/.test(text)) return { error: 'Negated or conditional instructions need explicit clarification.' };
  if ((text.match(/\b(?:reverse|double|halve)\b|反转|翻倍|减半/g) || []).length > 1) return { error: 'Use one relative acceleration change per message.' };
  const left = /\bleft(?:ward)?\b|向左/.test(text), right = /\bright(?:ward)?\b|向右/.test(text);
  const up = /\bup(?:ward)?\b|向上/.test(text), down = /\bdown(?:ward)?\b|向下/.test(text);
  const horizontal = /\bhorizontal\b|水平/.test(text), vertical = /\bvertical\b|竖直|垂直/.test(text);
  if ([left, right, up, down].filter(Boolean).length > 1 || (horizontal && (vertical || up || down)) || (vertical && (left || right))) {
    return { error: 'Choose one acceleration direction per message.' };
  }
  const property = up || down || vertical ? 'gravity' : 'acceleration_x';
  const target = 'world';
  const unitsRemoved = text.replace(/m\s*\/\s*s(?:\^?2|²)|met(?:er|re)s? per second squared|米\s*\/\s*秒(?:²|平方)/g, '');
  if (/\b(?:km|mph|ft)\b|m\s*\/\s*s|newton|牛顿/.test(unitsRemoved)) return { error: 'Acceleration uses m/s²; velocity and force units are different.' };
  const numbers = unitsRemoved.match(/-?(?:\d+(?:\.\d+)?|\.\d+)/g) || [];
  if (numbers.length > 1 || (numbers.length && /\b(?:reverse|double|halve)\b|反转|翻倍|减半/.test(text))) return { error: 'Use one acceleration change per message.' };
  if (/\breverse\b|反转/.test(text)) return { operation: { type: 'scale_property', target, property, factor: -1 } };
  if (/\bdouble\b|翻倍/.test(text)) return { operation: { type: 'scale_property', target, property, factor: 2 } };
  if (/\bhalve\b|减半/.test(text)) return { operation: { type: 'scale_property', target, property, factor: .5 } };
  const stop = /\b(?:stop|off|remove|disable)\b|停止|关闭|取消/.test(text);
  const number = numbers[0];
  const amount = stop ? 0 : number ? Number(number) : /\b(?:add|enable|turn on)\b|添加|增加/.test(text) ? 1 : undefined;
  if (amount === undefined || (!stop && !left && !right && !up && !down && !horizontal && !vertical)) {
    return { error: 'Specify an acceleration direction, e.g. add acceleration rightward.' };
  }
  if (amount < 0 && (left || right || up || down)) return { error: 'Use a positive magnitude with a direction, or a signed horizontal/vertical value.' };
  const value = left || up ? -Math.abs(amount) : right || down ? Math.abs(amount) : amount;
  return property === 'gravity' ? { operation: { type: 'set_gravity', acceleration: value } }
    : { operation: { type: 'set_property', target, property, value } };
}
