import type { LevelDefinition } from '../levels/types';
import type { PhysicsWorld, Telemetry } from './world';

export const EXIT_TRANSITION_SECONDS = 1.1;
export type ExitTransitionPhase = 'idle' | 'absorbing' | 'complete';
// Presentation is reported separately; PhysicsWorld.snapshot stays a physical result.
export type PresentationTelemetry = Telemetry & { exitTransition?: ExitTransitionPhase };
export interface ExitVisual {
  progress: number;
  target: { x: number; y: number };
  actor: { x: number; y: number; angle: number; scale: number; opacity: number };
  portalScale: number;
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p); };

// Owns only visual time and a copied pose. It never changes Matter bodies or scores.
export class ExitTransition {
  phase: ExitTransitionPhase = 'idle';
  private elapsed = 0;
  private origin = { x: 0, y: 0, angle: 0 };
  constructor(private readonly level: LevelDefinition) {}

  capture(world: PhysicsWorld, reducedMotion = false) {
    if (!world.won || this.phase !== 'idle') return;
    this.origin = { ...world.ball.position, angle: world.ball.angle };
    this.phase = reducedMotion ? 'complete' : 'absorbing';
    this.elapsed = reducedMotion ? EXIT_TRANSITION_SECONDS : 0;
  }

  advance(seconds: number, reducedMotion = false) {
    if (this.phase !== 'absorbing') return;
    this.elapsed = reducedMotion ? EXIT_TRANSITION_SECONDS
      : Math.min(EXIT_TRANSITION_SECONDS, this.elapsed + Math.max(0, Math.min(seconds, .05)));
    if (this.elapsed + 1e-9 >= EXIT_TRANSITION_SECONDS) this.phase = 'complete';
  }

  reset() { this.phase = 'idle'; this.elapsed = 0; }

  get visual(): ExitVisual | null {
    if (this.phase === 'idle') return null;
    const progress = clamp(this.elapsed / EXIT_TRANSITION_SECONDS);
    const exit = this.level.exit, target = { x: exit.x + exit.width / 2, y: exit.y + exit.height / 2 };
    const pull = smooth((progress - .12) / .7);
    const dx = target.x - this.origin.x, dy = target.y - this.origin.y, distance = Math.hypot(dx, dy);
    const bend = Math.sin(pull * Math.PI) * Math.min(25, distance * .35);
    const normalX = distance ? -dy / distance : 0, normalY = distance ? dx / distance : -1;
    return {
      progress, target,
      actor: {
        x: this.origin.x + dx * pull + normalX * bend,
        y: this.origin.y + dy * pull + normalY * bend,
        angle: this.origin.angle + pull * Math.PI * 1.4,
        scale: Math.pow(1 - smooth((progress - .3) / .55), .85),
        opacity: 1 - smooth((progress - .72) / .16),
      },
      portalScale: smooth(progress / .18) * (1 - smooth((progress - .86) / .14)),
    };
  }
}
