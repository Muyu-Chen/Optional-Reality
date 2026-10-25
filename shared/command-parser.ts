import { normalizeCommand } from './command-language';
import type { CommandNode, CommandProgram, CommandSubject, TargetReference } from './command-ast';
import type { PropertyName, RuleContext } from './rules';
import { PHYSICS_CAPABILITIES as capabilities } from './physics-capabilities';
import { SPRING_CONTROL_NAMES } from './spring-language';

interface Token { text: string; number?: number }
interface TargetWord { words: string[]; reference: TargetReference; kind?: string }
const syntaxError = () => new Error('Use AI preparation for instructions outside the local grammar. The whole message must be understood.');

// Chinese characters are individual tokens so dictionary phrases can compose
// without spaces. Unknown characters/words are retained, never discarded.
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const source = text.toLowerCase().replace(/['’]s\b/g, '');
  const pattern = /\s+|[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?|[a-z_][a-z0-9_-]*|[\u3400-\u9fff]|[^\s]/gy;
  for (const match of source.matchAll(pattern)) {
    const text = match[0];
    if (/^\s+$/.test(text)) continue;
    tokens.push({ text, ...(/^[+\-\d.]/.test(text) && text !== '.' ? { number: Number(text) } : {}) });
  }
  return tokens;
}

const propertyWords: readonly [PropertyName | 'acceleration', readonly string[]][] = [
  ['acceleration_x', capabilities.acceleration_x.commandNames],
  ['acceleration_y', capabilities.acceleration_y.commandNames],
  ['acceleration', ['acceleration', '加速度']],
  ['restitution', capabilities.restitution.commandNames],
  ['friction', capabilities.friction.commandNames],
];
const devices: readonly [string, PropertyName, readonly string[], readonly string[]][] = [
  ['fan', 'fan_power', capabilities.fan_power.commandNames, ['power', 'airflow', '功率', '风力']],
  ['spring', 'spring_power', capabilities.spring_power.commandNames, SPRING_CONTROL_NAMES],
  ['conveyor', 'conveyor_speed', capabilities.conveyor_speed.commandNames, ['speed', '速度']],
  ['rotor', 'angular_speed', capabilities.angular_speed.commandNames, ['speed', 'angular speed', '速度', '转速']],
];
const globals = ['world', 'environment', 'global surface', 'global surfaces', 'global', 'all surfaces', 'all surface', 'surface', 'surfaces', 'floor', 'ground', '全局表面', '全局', '所有表面', '表面', '地面'];
const relativeWords = [['double', '翻倍'], ['halve', '减半'], ['reverse', '反转']] as const;
const units = ['m/s²', 'm/s^2', 'm/s2', 'meters per second squared', 'metres per second squared', 'meter per second squared', 'metre per second squared', '米每秒平方', '米/秒平方', '米/秒²'];

class Parser {
  private index = 0;
  private tokens: Token[];
  private targetWords: TargetWord[];

  constructor(input: string, context?: RuleContext) {
    this.tokens = tokenize(normalizeCommand(input));
    const names = new Map<string, Set<string>>();
    for (const target of context?.targets || []) for (const name of [target.id, target.label, ...(target.aliases || [])]) {
      if (!name || target.id === 'world') continue;
      const normalized = name.toLowerCase();
      if (!names.has(normalized)) names.set(normalized, new Set());
      names.get(normalized)!.add(target.kind);
    }
    // Longest phrase wins. On an exact tie, reserved global scope stays global;
    // a registered scene name otherwise wins over a generic device name.
    this.targetWords = [
      ...globals.map<TargetWord>(name => ({ words: tokenize(name).map(t => t.text), reference: { type: 'world' }, kind: 'environment' })),
      ...[...names].map<TargetWord>(([name, kinds]) => ({ reference: { type: 'named', name }, words: tokenize(name).map(t => t.text), kind: kinds.size === 1 ? [...kinds][0] : undefined })),
      ...devices.flatMap(([kind, , words]) => words.map<TargetWord>(name => ({ words: tokenize(name).map(t => t.text), reference: { type: 'device', kind }, kind }))),
    ].sort((a, b) => b.words.length - a.words.length);
  }

  private matches(words: string[]) { return words.every((word, i) => this.tokens[this.index + i]?.text === word); }
  private take(...phrases: readonly string[]): boolean {
    const match = phrases.map(phrase => tokenize(phrase).map(t => t.text)).sort((a, b) => b.length - a.length).find(words => this.matches(words));
    if (!match) return false;
    this.index += match.length;
    return true;
  }
  private need(...phrases: string[]) { if (!this.take(...phrases)) throw syntaxError(); }
  private number() {
    const token = this.tokens[this.index];
    if (token?.number === undefined || !Number.isFinite(token.number)) throw syntaxError();
    this.index++;
    return token.number;
  }
  private relative(): number | undefined {
    for (const [index, words] of relativeWords.entries()) if (this.take(...words)) return [2, .5, -1][index];
  }
  private direction(): { axis: 'x' | 'y'; sign: number } | undefined {
    const entries = [
      ['x', -1, ['leftward', 'left', '向左', '往左']], ['x', 1, ['rightward', 'right', '向右', '往右']],
      ['y', -1, ['upward', 'up', '向上', '往上']], ['y', 1, ['downward', 'down', '向下', '往下']],
    ] as const;
    for (const [axis, sign, words] of entries) if (this.take(...words)) return { axis, sign };
  }
  private target(): { reference: TargetReference; kind?: string } | undefined {
    const start = this.index;
    let entry = this.targetWords.find(entry => this.matches(entry.words));
    if (!entry && this.take('the')) entry = this.targetWords.find(entry => this.matches(entry.words));
    if (entry) { this.index += entry.words.length; return { reference: entry.reference, kind: entry.kind }; }
    this.index = start;
  }
  private targets() {
    const both = this.take('both');
    const first = this.target();
    if (!first) { if (both) throw syntaxError(); return; }
    const targets = [first];
    while (targets.length <= 16) {
      const start = this.index;
      if (this.take('、', ',', '，')) this.take('and', '和', '与');
      else if (!this.take('and', '和', '与')) break;
      const next = this.target();
      if (!next) { this.index = start; break; }
      targets.push(next);
    }
    if (targets.length > 16 || (both && targets.length < 2)) throw syntaxError();
    return targets;
  }
  private subject(): { subject: CommandSubject; unspecifiedAxis: boolean } {
    let targets = this.targets();
    if (!targets) this.take('the');
    this.take('的');
    let property: PropertyName | 'acceleration' | undefined;
    // Device control nouns are meaningful only after a device reference.
    const device = devices.find(([kind]) => targets?.[0].kind === kind);
    if (device) {
      property = device[1];
      this.take(property, ...device[3]);
    } else {
      for (const [candidate, words] of propertyWords) if (this.take(...words)) { property = candidate; break; }
    }
    if (!property) throw syntaxError();
    if (this.take('of', 'on')) {
      if (targets) throw syntaxError();
      targets = this.targets();
      if (!targets) throw syntaxError();
    }
    return { subject: { targets: targets?.map(item => item.reference) || [{ type: 'world' }], property: property === 'acceleration' ? 'acceleration_x' : property }, unspecifiedAxis: property === 'acceleration' };
  }
  private sensorTrigger(): CommandNode | undefined {
    const start = this.index;
    if (this.take('when')) {
      this.take('the'); this.need('energy core', 'core', 'ball', 'bread', 'loaf');
      this.need('touches', 'hits'); this.take('the');
      this.endpoint('sensor');
      this.take(','); this.need('open'); this.take('the');
      this.endpoint('gate');
      return { type: 'sensor_trigger' };
    }
    if (this.take('当')) {
      this.need('小球', '能量球', '面包'); this.need('碰到', '碰撞', '触碰', '接触');
      this.endpoint('sensor');
      this.take('时'); this.take('，', ','); this.need('打开', '开启');
      this.endpoint('gate');
      return { type: 'sensor_trigger' };
    }
    this.index = start;
  }
  private endpoint(kind: 'sensor' | 'gate'): void {
    if (this.take(...(kind === 'sensor' ? ['sensor', 'bell', '传感器', '感应器', '铃'] : ['gate', 'shutter', '门', '卷帘']))) return;
    throw syntaxError();
  }
  private statement(): CommandNode {
    const trigger = this.sensorTrigger();
    if (trigger) return trigger;
    const prefixDirection = this.direction();
    const factor = this.relative();
    const multiply = factor === undefined && this.take('multiply', 'scale');
    const stop = factor === undefined && !multiply && this.take('turn off', 'stop', 'disable', 'remove', 'no', '停止', '关闭', '取消');
    const enable = factor === undefined && !multiply && !stop && this.take('turn on', 'add', 'enable', '添加', '增加', '开启');
    const make = factor === undefined && !multiply && !stop && !enable && this.take('make');
    if (factor === undefined && !multiply && !stop && !enable && !make) this.take('set', 'change', '设置');
    this.take('把', '将');
    const { subject, unspecifiedAxis } = this.subject();
    const acceleration = subject.property === 'acceleration_x' || subject.property === 'acceleration_y';
    if (make) this.need('spin');
    const rotation = this.take('counterclockwise', 'anticlockwise', '逆时针') ? -1 : this.take('clockwise', '顺时针') ? 1 : undefined;
    if (rotation !== undefined && subject.property !== 'angular_speed') throw syntaxError();
    const beforeDirection = this.index;
    this.take('to the', 'to');
    const suffixDirection = this.direction();
    if (!suffixDirection) this.index = beforeDirection;
    if (prefixDirection && suffixDirection) throw syntaxError();
    const direction = prefixDirection || suffixDirection;
    if (direction) {
      if (!acceleration || (!unspecifiedAxis && subject.property !== `acceleration_${direction.axis}`)) throw syntaxError();
      subject.property = `acceleration_${direction.axis}`;
    } else if (unspecifiedAxis) throw syntaxError();
    const suffixFactor = this.relative();
    if (factor !== undefined || suffixFactor !== undefined || multiply) {
      if ((factor !== undefined && suffixFactor !== undefined) || stop || enable || make || direction || rotation) throw syntaxError();
      if (multiply) this.need('by');
      return { type: 'scale', subject, factor: multiply ? this.number() : (factor ?? suffixFactor)! };
    }
    if (make && subject.property !== 'angular_speed') throw syntaxError();
    const assignment = this.take('at speed', 'to', 'at', '=', '为', '到', '设为', '设成', ...(acceleration ? ['of'] : []));
    let value: number;
    if (stop) {
      if (assignment) throw syntaxError();
      value = 0;
    } else if (enable && !assignment && this.tokens[this.index]?.number === undefined) {
      if (!acceleration) throw syntaxError();
      value = 1;
    } else value = this.number();
    if (acceleration) this.take(...units);
    if (direction && value < 0) throw syntaxError();
    return { type: 'set', subject, value: direction ? value * direction.sign : rotation ? Math.abs(value) * rotation : value };
  }

  parse(): CommandProgram {
    const statements: CommandNode[] = [];
    if (!this.tokens.length) throw syntaxError();
    while (statements.length < 16) {
      statements.push(this.statement());
      if (this.take('.', '。', '!', '！', '?', '？')) {
        if (this.index !== this.tokens.length) throw syntaxError();
        break;
      }
      if (this.index === this.tokens.length) break;
      if (this.take(';', '；', ',', '，')) this.take('and', '并且', '同时', '并');
      else this.need('and', '并且', '同时', '并', '和');
      if (this.index === this.tokens.length) throw syntaxError();
    }
    if (this.index !== this.tokens.length) throw syntaxError();
    return { type: 'program', statements };
  }
}

export function parseCommandTree(input: string, context?: RuleContext): CommandProgram {
  if (input.trim().length > 240) throw syntaxError();
  return new Parser(input, context).parse();
}
