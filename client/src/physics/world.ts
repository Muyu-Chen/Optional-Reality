import Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';
import { initialRules, ruleContext } from '../levels/rules';
import { applyRules, type Operation, type RuleState } from '../../../shared/rules';
import { DeviceRuntime } from './devices';
import { createSceneBodies } from './scene-bodies';
import { GoalTracker } from './goal';

const { Engine, Composite } = Matter;
export const STEP_MS = 1000 / 120;

export interface Telemetry { running: boolean; started: boolean; gravity: number; tick: number; won: boolean; timedOut: boolean; fell: boolean; tutorialId: string | null; x: number; y: number }

export function initialTelemetry(level: LevelDefinition): Telemetry {
  return {
    running: false, started: false, gravity: level.initialGravity, tick: 0,
    won: false, timedOut: false, fell: false, tutorialId: null, x: level.ball.position[0], y: level.ball.position[1],
  };
}

export class PhysicsWorld {
  engine: Matter.Engine;
  ball: Matter.Body;
  gravity: number;
  readonly limitTicks: number;
  tick = 0;
  started = false;
  running = false;
  won = false;
  timedOut = false;
  fell = false;
  tutorialId: string | null = null;
  readonly seenTutorials: Set<string>;
  rules: RuleState;
  readonly devices: DeviceRuntime;
  readonly goal: GoalTracker;
  private history: { before: RuleState; operations: readonly Operation[]; text: string }[] = [];
  private readonly surfaces: Map<string, Matter.Body[]>;
  get commandCount() { return this.history.length; }

  constructor(readonly level: LevelDefinition, seenTutorials: Iterable<string> = []) {
    this.seenTutorials = new Set(seenTutorials);
    const { viewport, initialGravity } = level;
    this.rules = initialRules(level);
    this.gravity = initialGravity;
    this.limitTicks = Math.round(level.timeLimitSeconds * 1000 / STEP_MS);
    this.engine = Engine.create({ gravity: { x: 0, y: initialGravity, scale: viewport.pixelsPerMetre / 1_000_000 } });
    const scene = createSceneBodies(level);
    this.ball = scene.ball;
    this.surfaces = scene.surfaces;
    Composite.add(this.engine.world, scene.bodies);
    this.devices = new DeviceRuntime(level, this.engine, this.ball);
    this.goal = new GoalTracker(level);
    this.syncRules();
  }

  setGravity(value: number) {
    this.rules = applyRules(this.rules, [{ type: 'set_gravity', acceleration: value }], ruleContext(this.level));
    this.syncRules();
  }
  applyMessages(messages: readonly { text: string; operations: readonly Operation[] }[]) {
    if (this.won || this.timedOut) throw new Error('Reset the experiment before sending more rules.');
    if (!messages.length || messages.some(message => !message.operations.length)) throw new Error('Empty message batch.');
    if (this.level.commandLimit && this.commandCount + messages.length > this.level.commandLimit) throw new Error('Command budget exhausted. Reset to start over.');
    let next = this.rules;
    const entries = messages.map(message => {
      const before = next;
      next = applyRules(next, message.operations, ruleContext(this.level));
      return { before, operations: [...message.operations], text: message.text };
    });
    this.rules = next; this.history.push(...entries); this.syncRules();
  }
  undoRule() {
    const entry = this.history.pop();
    if (!entry) return false;
    this.rules = entry.before; this.syncRules(); return true;
  }
  // A fresh attempt with the current rules. This differs from a tick-by-tick history replay.
  retryWithRules() {
    const next = new PhysicsWorld(this.level,this.seenTutorials);
    next.rules = structuredClone(this.rules);
    next.history = structuredClone(this.history);
    next.syncRules();
    return next;
  }
  private syncRules() {
    this.gravity = this.rules.gravity; this.engine.gravity.y = this.gravity;
    this.engine.gravity.x = this.rules.values.world?.acceleration_x ?? 0;
    for (const [id, bodies] of this.surfaces) for (const body of bodies) {
      body.restitution = this.rules.values[id]?.restitution ?? this.rules.values.world?.restitution ?? 0;
      body.friction = this.rules.values[id]?.friction ?? this.rules.values.world?.friction ?? 0;
    }
    this.devices.syncRules(this.rules);
  }
  start() { if (!this.won && !this.timedOut && !this.tutorialId) { this.started = true; this.running = true; } }
  continueTutorial() { this.tutorialId=null;this.start(); }
  pause() { this.running = false; }
  step() {
    if (!this.running || this.won || this.timedOut) return;
    this.devices.beforeStep(this.rules, STEP_MS / 1000);
    for(const event of this.devices.takeEvents()) {
      const tutorial=this.level.tutorials?.find(item => item.deviceId === event.deviceId);
      if(event.type === 'spring_charging' && tutorial && !this.seenTutorials.has(tutorial.id)) {
        this.seenTutorials.add(tutorial.id);this.tutorialId=tutorial.id;this.pause();return;
      }
    }
    Engine.update(this.engine, STEP_MS);
    this.tick++;
    this.devices.afterStep(this.rules);
    if (this.goal.update(this.ball, STEP_MS / 1000)) {
      this.won = true;
      this.running = false;
    } else if (this.tick >= this.limitTicks || (this.level.failOnFall && this.ball.bounds.min.y > this.level.viewport.height)) {
      this.fell = this.tick < this.limitTicks;
      this.timedOut = true;
      this.running = false;
    }
  }
  snapshot(): Telemetry {
    return { running: this.running, started: this.started, gravity: this.gravity, tick: this.tick, won: this.won, timedOut: this.timedOut, fell: this.fell, tutorialId: this.tutorialId, x: this.ball.position.x, y: this.ball.position.y };
  }
  destroy() { Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}
