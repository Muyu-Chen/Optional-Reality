import Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';

const { Engine, Bodies, Body, Composite } = Matter;
export const STEP_MS = 1000 / 120;

function touchesExit({ x, y }: Matter.Vector, radius: number, exit: LevelDefinition['exit']) {
  const closestX = Math.max(exit.x, Math.min(x, exit.x + exit.width));
  const closestY = Math.max(exit.y, Math.min(y, exit.y + exit.height));
  return (x - closestX) ** 2 + (y - closestY) ** 2 <= radius ** 2;
}
export interface Telemetry { running: boolean; started: boolean; gravity: number; tick: number; won: boolean; timedOut: boolean; x: number; y: number }

export function initialTelemetry(level: LevelDefinition): Telemetry {
  return {
    running: false, started: false, gravity: level.initialGravity, tick: 0,
    won: false, timedOut: false, x: level.ball.position[0], y: level.ball.position[1],
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

  constructor(readonly level: LevelDefinition) {
    const { viewport, ball, initialGravity } = level;
    this.gravity = initialGravity;
    this.limitTicks = Math.round(level.timeLimitSeconds * 1000 / STEP_MS);
    this.engine = Engine.create({ gravity: { x: 0, y: initialGravity, scale: viewport.pixelsPerMetre / 1_000_000 } });
    const surface = { isStatic: true, friction: 0, restitution: 0 };
    const rails: Matter.Body[] = [];
    for (const track of level.tracks) {
      const material = { ...surface, label: track.id };
      for (let i = 0; i < track.points.length - 1; i++) {
        const [a, b] = [track.points[i], track.points[i + 1]];
        rails.push(Bodies.rectangle((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(b[0] - a[0], b[1] - a[1]) + 2, track.thickness, { ...material, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) }));
      }
      for (const [x, y] of track.points) rails.push(Bodies.circle(x, y, track.thickness / 2, material));
    }
    this.ball = Bodies.circle(...ball.position, ball.radius, { friction: 0, frictionStatic: 0, frictionAir: 0, restitution: ball.restitution, label: ball.id });
    // Matter normalises velocity to its 60 Hz reference step.
    Body.setVelocity(this.ball, {
      x: ball.velocity[0] * viewport.pixelsPerMetre / 60,
      y: ball.velocity[1] * viewport.pixelsPerMetre / 60,
    });
    const { width, height } = viewport;
    Composite.add(this.engine.world, [
      ...rails, this.ball,
      Bodies.rectangle(width / 2, height + 18, width + 72, 36, { ...surface, label: 'boundary-bottom' }),
      Bodies.rectangle(-18, height / 2, 36, height * 2, { ...surface, label: 'boundary-left' }),
      Bodies.rectangle(width + 18, height / 2, 36, height * 2, { ...surface, label: 'boundary-right' }),
      Bodies.rectangle(width / 2, -18, width + 72, 36, { ...surface, label: 'boundary-top' }),
    ]);
  }

  setGravity(value: number) {
    if (!Number.isFinite(value) || Math.abs(value) > 10) throw new Error('Gravity is outside the demo range.');
    this.gravity = value;
    this.engine.gravity.y = value;
  }
  start() { if (!this.won && !this.timedOut) { this.started = true; this.running = true; } }
  pause() { this.running = false; }
  step() {
    if (!this.running || this.won || this.timedOut) return;
    Engine.update(this.engine, STEP_MS);
    this.tick++;
    // Any part of the ball touching the visible exit counts, including its edges.
    if (touchesExit(this.ball.position, this.level.ball.radius, this.level.exit)) {
      this.won = true;
      this.running = false;
    } else if (this.tick >= this.limitTicks) {
      this.timedOut = true;
      this.running = false;
    }
  }
  snapshot(): Telemetry {
    return { running: this.running, started: this.started, gravity: this.gravity, tick: this.tick, won: this.won, timedOut: this.timedOut, x: this.ball.position.x, y: this.ball.position.y };
  }
  destroy() { Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}
