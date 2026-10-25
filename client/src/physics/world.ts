import Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';
import { initialRules, ruleContext } from '../levels/rules';
import { applyRules, type Operation, type RuleState } from '../../../shared/rules';
import { DeviceRuntime } from './devices';
import { createSceneBodies } from './scene-bodies';
import { OvertimeBoundary } from './overtime';
import { OVERTIME_SECONDS } from '../domain/round';
import { SimulationJournal } from './simulation-journal';
import { GoalTracker } from './goal';
import { StarCollection } from './stars';
import { outsidePlayArea, type PlayAreaEdge } from './play-area';

const { Engine, Composite } = Matter;
export const STEP_MS = 1000 / 120;

export interface Telemetry { overtime: boolean; running: boolean; started: boolean; acceleration: RuleState['acceleration']; stars: {collected:number;total:number}; tick: number; won: boolean; timedOut: boolean; fell: boolean; outOfBounds: PlayAreaEdge | null; tutorialId: string | null; x: number; y: number }

export function initialTelemetry(level: LevelDefinition): Telemetry {
  return {
    overtime:false,running: false, started: false, acceleration:{x:level.initialAcceleration[0],y:level.initialAcceleration[1]}, stars:{collected:0,total:level.stars?.length || 0}, tick: 0,
    won: false, timedOut: false, fell: false, outOfBounds: null, tutorialId: null, x: level.ball.position[0], y: level.ball.position[1],
  };
}

export class PhysicsWorld {
  engine: Matter.Engine;
  ball: Matter.Body;
  get gravity() { return this.rules.acceleration.y; }
  readonly limitTicks: number;
  private readonly rescue = new OvertimeBoundary();
  get overtime() { return this.rescue.active; }
  get deadlineTicks() { return this.limitTicks+(this.overtime?Math.round(OVERTIME_SECONDS*1000/STEP_MS):0); }
  tick = 0;
  started = false;
  running = false;
  won = false;
  timedOut = false;
  outOfBounds: PlayAreaEdge | null = null;
  // Retain the existing terminal-failure flags for queue/session consumers.
  get fell() { return this.outOfBounds !== null; }
  tutorialId: string | null = null;
  readonly seenTutorials: Set<string>;
  rules: RuleState;
  readonly devices: DeviceRuntime;
  readonly goal: GoalTracker;
  readonly stars: StarCollection;
  private readonly journal = new SimulationJournal();
  private readonly initialTutorials: string[];
  private ruleRevision = 0;
  lastRuleChange: { revision:number; tick:number; checkpoint:number; before:RuleState; after:RuleState } | null = null;
  private history: { before: RuleState; operations: readonly Operation[]; text: string }[] = [];
  private readonly surfaces: Map<string, Matter.Body[]>;
  get commandCount() { return this.history.length; }

  constructor(readonly level: LevelDefinition, seenTutorials: Iterable<string> = []) {
    this.initialTutorials = [...seenTutorials];
    this.seenTutorials = new Set(this.initialTutorials);
    const { viewport, initialAcceleration } = level;
    this.rules = initialRules(level);
    this.limitTicks = Math.round(level.timeLimitSeconds * 1000 / STEP_MS);
    this.engine = Engine.create({ gravity: { x: initialAcceleration[0], y: initialAcceleration[1], scale: viewport.pixelsPerMetre / 1_000_000 } });
    const scene = createSceneBodies(level);
    this.ball = scene.ball;
    this.surfaces = scene.surfaces;
    Composite.add(this.engine.world, scene.bodies);
    this.devices = new DeviceRuntime(level, this.engine, this.ball);
    this.goal = new GoalTracker(level);
    this.stars = new StarCollection(level);
    this.syncRules();
  }

  setGravity(value: number) {
    this.lastRuleChange=null;
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
    this.lastRuleChange = {revision:++this.ruleRevision,tick:this.tick,checkpoint:this.journal.entries.length,
      before:structuredClone(this.rules),after:structuredClone(next)};
    this.rules = next; this.history.push(...entries); this.syncRules();
  }
  undoRule() {
    const entry = this.history.pop();
    if (!entry) return false;
    this.lastRuleChange=null;this.rules = entry.before; this.syncRules(); return true;
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
    this.engine.gravity.y = this.rules.acceleration.y;
    this.engine.gravity.x = this.rules.acceleration.x;
    for (const [id, bodies] of this.surfaces) for (const body of bodies) {
      body.restitution = this.rules.values[id]?.restitution ?? this.rules.values.world?.restitution ?? 0;
      body.friction = this.rules.values[id]?.friction ?? this.rules.values.world?.friction ?? 0;
    }
    this.devices.syncRules(this.rules);
    this.journal.rules(this.rules);
  }
  start() { if (!this.won && !this.timedOut && !this.tutorialId) { this.started = true; this.running = true; } }
  continueTutorial() { this.tutorialId=null;this.start(); }
  pause() { this.running = false; }
  step() {
    if (!this.running || this.won || this.timedOut) return;
    this.journal.step(this.started,this.tutorialId,this.seenTutorials);
    this.devices.beforeStep(this.rules, STEP_MS / 1000);
    for(const event of this.devices.takeEvents()) {
      const tutorial=this.level.tutorials?.find(item => item.deviceId === event.deviceId);
      if(event.type === 'spring_charging' && tutorial && !this.seenTutorials.has(tutorial.id)) {
        this.seenTutorials.add(tutorial.id);this.tutorialId=tutorial.id;this.pause();return;
      }
    }
    const previous: readonly [number,number]=[this.ball.position.x,this.ball.position.y];
    Engine.update(this.engine, STEP_MS);
    this.tick++;
    this.devices.afterStep(this.rules);
    this.stars.update(this.ball,previous);
    if (this.goal.update(this.ball, STEP_MS / 1000)) {
      this.won = true;
      this.running = false;
    } else {
      this.outOfBounds = outsidePlayArea(this.ball, this.level);
      if(!this.outOfBounds && !this.overtime && this.tick>=this.limitTicks)this.rescue.activate(this.engine,this.level);
      if (this.outOfBounds || this.tick >= this.deadlineTicks) {
        this.timedOut = true;
        this.running = false;
      }
    }
  }
  /** Rebuild the exact pre-change world, including collision warm-up and device state.
   * Return nothing when an unrecorded external mutation prevents an exact replay. */
  forkBeforeLastRuleChange(): PhysicsWorld | null {
    const change=this.lastRuleChange;
    if(!change || change.tick!==this.tick)return null;
    const fork=new PhysicsWorld(this.level,this.initialTutorials);
    fork.journal.recording=false;
    try {
      for(const entry of this.journal.entries.slice(0,change.checkpoint)) {
        if(entry.type==='rules') { fork.rules=structuredClone(entry.rules);fork.syncRules(); }
        else {
          fork.seenTutorials.clear();for(const id of entry.seenTutorials)fork.seenTutorials.add(id);
          fork.started=entry.started;fork.tutorialId=entry.tutorialId;fork.running=true;fork.step();
        }
      }
      const originals=Composite.allBodies(this.engine.world),copies=Composite.allBodies(fork.engine.world);
      const exact=fork.tick===this.tick && JSON.stringify(fork.rules)===JSON.stringify(change.before)
        && Math.abs(fork.goal.progress-this.goal.progress)<1e-7
        && fork.stars.collected.size===this.stars.collected.size && [...fork.stars.collected].every(id=>this.stars.collected.has(id))
        && originals.length===copies.length && originals.every((body,i)=>{
        const copy=copies[i];
        return body.mass===copy.mass && body.inertia===copy.inertia && [body.position.x-copy.position.x,body.position.y-copy.position.y,body.velocity.x-copy.velocity.x,
          body.velocity.y-copy.velocity.y,body.angle-copy.angle,body.angularVelocity-copy.angularVelocity,
          body.force.x-copy.force.x,body.force.y-copy.force.y,body.torque-copy.torque]
          .every(delta=>Number.isFinite(delta)&&Math.abs(delta)<1e-7);
      });
      if(!exact) { fork.destroy();return null; }
      fork.started=this.started;fork.running=this.running;fork.tutorialId=this.tutorialId;
      return fork;
    } catch { fork.destroy();return null; }
  }
  snapshot(): Telemetry {
    return { overtime:this.overtime,running: this.running, started: this.started, acceleration:{...this.rules.acceleration}, stars:this.stars.snapshot(), tick: this.tick, won: this.won, timedOut: this.timedOut, fell: this.fell, outOfBounds: this.outOfBounds, tutorialId: this.tutorialId, x: this.ball.position.x, y: this.ball.position.y };
  }
  destroy() { this.journal.entries.length=0;Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}
