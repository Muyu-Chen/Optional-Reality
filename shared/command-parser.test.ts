import { describe, expect, it } from 'vitest';
import { parseCommandTree } from './command-parser';
import { compileCommandTree } from './command-compiler';
import { parseCommands } from './commands';
import { applyRules, type RuleContext } from './rules';
import { applyBatch, messageOperations, prepareMessage } from '../client/src/domain/queue';
import { catchCup } from '../client/src/levels/catch-cup';
import { realityBreakdown } from '../client/src/levels/reality-breakdown';
import { gravityLab } from '../client/src/levels/gravity-lab';
import { initialRules, ruleContext } from '../client/src/levels/rules';

const cup = ruleContext(catchCup), factory = ruleContext(realityBreakdown);
const set = (property: string, value: number, target = 'world') => ({ type: 'set_property', target, property, value });
const scale = (property: string, factor: number, target = 'world') => ({ type: 'scale_property', target, property, factor });

describe('local command AST and lowering', () => {
  it('retains unresolved targets and relative intent before lowering to scene IDs', () => {
    const ast = parseCommandTree('把发射板和杯底的弹性设为 0.2，并把水平加速度翻倍', cup);
    expect(ast).toEqual({ type: 'program', statements: [
      { type: 'set', subject: { targets: [{ type: 'named', name: '发射板' }, { type: 'named', name: '杯底' }], property: 'restitution' }, value: .2 },
      { type: 'scale', subject: { targets: [{ type: 'world' }], property: 'acceleration_x' }, factor: 2 },
    ] });
    expect(compileCommandTree(ast, cup)).toEqual([set('restitution', .2, 'launch-pad'), set('restitution', .2, 'cup-base'), scale('acceleration_x', 2)]);
  });

  it.each([
    ['stop gravity and set surface friction to 0.3', [set('acceleration_y', 0), set('friction', .3)]],
    ['Set gravity to 2 and bounce to 0.7', [set('acceleration_y', 2), set('restitution', .7)]],
    ['关闭重力，并设置摩擦为 0.3', [set('acceleration_y', 0), set('friction', .3)]],
    ['停止重力；摩擦减半', [set('acceleration_y', 0), scale('friction', .5)]],
    ['gravity = 2; reverse gravity; halve horizontal acceleration', [set('acceleration_y', 2), scale('acceleration_y', -1), scale('acceleration_x', .5)]],
    ['add acceleration right word, and add acceleration upward 2 m/s²', [set('acceleration_x', 1), set('acceleration_y', -2)]],
    ['double all surface friction', [scale('friction', 2)]],
    ['halve the gravity', [scale('acceleration_y', .5)]],
    ['multiply friction by 0.25', [scale('friction', .25)]],
    ['摩擦翻倍', [scale('friction', 2)]],
    ['fan power = 1; 风扇功率翻倍', [set('fan_power', 1, 'fan-main'), scale('fan_power', 2, 'fan-main')]],
    ['风扇功率减半', [scale('fan_power', .5, 'fan-main')]],
    ['reverse conveyor speed', [scale('conveyor_speed', -1, 'belt-main')]],
    ['fan-main power = 0.5', [set('fan_power', .5, 'fan-main')]],
    ['gravity upward 20 m/s^2', [set('acceleration_y', -20)]],
    ['add acceleration upward of 1', [set('acceleration_y', -1)]],
    ['向左添加加速度 0.5 米每秒平方。', [set('acceleration_x', -.5)]],
  ])('fully parses %s', (input, expected) => {
    expect(parseCommands(input, factory)).toEqual({ operations: expected });
  });

  it.each([
    ['Set both the launch pad and the cup base bounce to 0.5', [set('restitution', .5, 'launch-pad'), set('restitution', .5, 'cup-base')]],
    ['Set the bounce of both the launch pad and the cup base to 0.5', [set('restitution', .5, 'launch-pad'), set('restitution', .5, 'cup-base')]],
    ['Double the friction of the launch pad and the cup base', [scale('friction', 2, 'launch-pad'), scale('friction', 2, 'cup-base')]],
    ['设置发射板和杯底的弹性为0.5', [set('restitution', .5, 'launch-pad'), set('restitution', .5, 'cup-base')]],
    ['发射板、杯底弹性减半', [scale('restitution', .5, 'launch-pad'), scale('restitution', .5, 'cup-base')]],
    ["double the launch pad and the cup's friction", [scale('friction', 2, 'launch-pad'), scale('friction', 2, 'cup-base')]],
    ['set global surface bounce to 0.8 and cup base bounce to 0', [set('restitution', .8), set('restitution', 0, 'cup-base')]],
  ])('preserves explicit target order and scope: %s', (input, expected) => {
    expect(parseCommands(input, cup)).toEqual({ operations: expected });
  });

  it('does not apply a relative change twice when two aliases name the same target', () => {
    expect(parseCommands('double cup and cup-base friction', cup)).toEqual({ operations: [scale('friction', 2, 'cup-base')] });
  });
  it('matches the complete longest alias, including names containing conjunctions', () => {
    const context: RuleContext = { ...cup, targets: [...cup.targets, { id: 'new-pad', label: 'Rock and roll pad', kind: 'surface', properties: { friction: [0, 1] } }] };
    expect(parseCommands('set rock and roll pad friction to .2 and stop gravity', context)).toEqual({ operations: [set('friction', .2, 'new-pad'), set('acceleration_y', 0)] });
  });
  it('preserves labels containing articles and reserves explicit global scope', () => {
    const context: RuleContext = { ...cup, targets: [...cup.targets,
      { id: 'article-pad', label: 'The soft pad', kind: 'surface', properties: { friction: [0, 1] } },
      { id: 'misleading-pad', label: 'All surfaces', kind: 'surface', properties: { friction: [0, 1] } },
    ] };
    expect(parseCommands('set the soft pad friction to .2', context).operations).toEqual([set('friction', .2, 'article-pad')]);
    expect(parseCommands('double all surfaces friction', context).operations).toEqual([scale('friction', 2)]);
  });
  it('keeps sensor contact as the sole supported automatic condition', () => {
    expect(parseCommands('When the ball touches the sensor, open the gate and stop gravity', factory)).toEqual({ operations: [
      { type: 'add_sensor_trigger', sensor: 'sensor-gate', gate: 'gate-final' }, set('acceleration_y', 0),
    ] });
    expect(parseCommands('当小球碰到铃时，打开门', factory)).toEqual({ operations: [
      { type: 'add_sensor_trigger', sensor: 'sensor-gate', gate: 'gate-final' },
    ] });
  });
});

describe('complete-message fallback and execution boundaries', () => {
  it.each([
    'set gravity to 2 and teleport the ball', 'set gravity to 2; unknown instruction',
    'set gravity to 2 then set bounce to .5', 'set gravity to 2 and then stop gravity',
    '设置重力为2，然后关闭风扇', 'set gravity to 2 for 3 seconds', 'stop gravity until the ball lands',
    'set cup and missing pad friction to .2', 'set cup lid bounce to .5', 'set cupcake friction to .3',
    'set cup friction to .3 except the launch pad', 'do not stop gravity', '不要关闭重力',
    'set gravity to 2 m/s', 'set gravity to 2 newtons', 'set fan power to 1 m/s²',
    'add acceleration leftward and rightward', 'set acceleration rightward -2', 'set acceleration to 2',
    'set gravity to 2 3', 'double gravity to 2', 'stop gravity to 3', 'double reverse gravity',
    'set gravity to Infinity', 'set gravity to NaN', 'set gravity to 1e999',
    'set gravity to 2 and', 'stop gravity;', 'and stop gravity', 'stop gravity and and stop gravity',
    'set launch pad and and cup base friction to .3',
    'stop gravity but also set friction to .3', 'stop gravity; execute javascript',
    '横着往左拉一点吧，水平加速度设成 0.5 米每秒平方。', '向上的浮力',
  ])('never keeps a locally understood prefix of %s', input => {
    const message = prepareMessage('bad', input, cup, initialRules(catchCup));
    expect(message.status).toBe('error');
    expect(message.requiresAI).toBe(true);
    expect(messageOperations(message)).toEqual([]);
  });

  it('rejects ambiguous names and generic devices rather than choosing the first', () => {
    const context = { ...factory, targets: [...factory.targets, { id: 'another-fan', kind: 'fan', properties: { fan_power: [-2, 2] as const } }] };
    expect(parseCommands('double fan power', context).error).toBeTruthy();
    expect(parseCommands('double fan-main power', context).operations).toEqual([scale('fan_power', 2, 'fan-main')]);
    expect(parseCommands('halve fan-main and another-fan power', context).operations).toEqual([scale('fan_power', .5, 'fan-main'), scale('fan_power', .5, 'another-fan')]);
    const ambiguous = { ...cup, targets: cup.targets.map(target => ({ ...target, aliases: [...(target.aliases || []), 'pad'] })) };
    expect(parseCommands('set pad friction to .2', ambiguous).error).toBeTruthy();
    expect(parseCommands('set fan and toaster power to 1', factory).error).toBeTruthy();
    expect(parseCommands('when the ball touches the sensor, open the gate', { ...factory, sensors: ['first', 'second'] }).error).toBeTruthy();
  });
  it('limits expansion to 16 operations, including a trailing connector at the limit', () => {
    const text = Array(16).fill('gravity=0').join(';');
    expect(parseCommands(text).operations).toHaveLength(16);
    expect(parseCommands(`${text};`).error).toBeTruthy();
    expect(parseCommands(`${text};gravity=0`).error).toBeTruthy();
    const context = { ...cup, targets: [...cup.targets, ...Array.from({ length: 9 }, (_, i) => ({ id: `s${i}`, kind: 'surface', properties: { friction: [0, 1] as const } }))] };
    const many = `double ${Array.from({ length: 9 }, (_, i) => `s${i}`).join(' and ')} friction`;
    expect(parseCommands(`${many};${many}`, context).error).toBeTruthy();
  });
  it('validates all targets before preparing and leaves the original world untouched', () => {
    const state = initialRules(catchCup), before = structuredClone(state);
    const message = prepareMessage('preset', 'stop gravity and set cup base and left cup wall bounce to .5', cup, state);
    expect(message.status).toBe('error');
    expect(messageOperations(message)).toEqual([]);
    expect(state).toEqual(before);
    const readonly = prepareMessage('preset-relative', 'stop gravity and double left cup wall friction', cup, state);
    expect(readonly.status).toBe('error');
    expect(messageOperations(readonly)).toEqual([]);
    expect(prepareMessage('no-snapshot', 'double left cup wall friction', cup)).toMatchObject({ status: 'error' });
  });
  it('bounds every absolute value, retains correction feedback, and evaluates relative values at execution', () => {
    const state = initialRules(gravityLab), context = ruleContext(gravityLab);
    const message = prepareMessage('multi', 'set gravtiy to 999 and halve gravity and add acceleration right word', context, state);
    expect(message).toMatchObject({ status: 'ready', source: 'local', understoodAs: 'set gravity to 999 and halve gravity and add acceleration rightward', adjustments: [{ requested: 999, applied: 100 }] });
    expect(state.acceleration).toEqual({ x: 0, y: 0 });
    expect(applyBatch([message], ['multi'], state, 4, context).rules.acceleration).toEqual({ x: 1, y: 50 });
    const relative = prepareMessage('relative', 'double gravity and halve horizontal acceleration', context, state);
    const changed = applyRules(state, [set('acceleration_y', 3), set('acceleration_x', 4)], context);
    expect(applyBatch([relative], ['relative'], changed, 5, context).rules.acceleration).toEqual({ x: 2, y: 6 });
  });
  it('global edits preserve existing local overrides after multiple statements', () => {
    const state = initialRules(catchCup), before = structuredClone(state);
    const message = prepareMessage('global', 'set all surface bounce to .8 and double all surface friction', cup, state);
    const after = applyBatch([message], ['global'], state, 1, cup).rules;
    expect(after.values.world.restitution).toBe(.8);
    expect(after.values['cup-base']).toEqual(before.values['cup-base']);
    expect(after.values['launch-pad']).toEqual(before.values['launch-pad']);
  });
});
