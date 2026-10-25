import type Matter from 'matter-js';
import type { LevelDefinition } from '../levels/types';
import { actorBounds } from './play-area';

export class GoalTracker {
  private heldSeconds = 0;
  get progress() { return this.condition ? Math.min(1, this.heldSeconds / this.condition.seconds) : 0; }
  private get condition() { return this.level.exit.condition; }

  constructor(private readonly level: LevelDefinition) {
    const condition = this.condition;
    if (condition && (!Number.isFinite(condition.seconds) || condition.seconds <= 0
      || !Number.isFinite(condition.maxSpeed) || condition.maxSpeed < 0)) throw new Error('Invalid settling goal.');
  }

  update(body: Matter.Body, seconds: number): boolean {
    const exit = this.level.exit;
    if (!this.condition) {
      if (this.level.ball.shape?.kind === 'box') return this.overlaps(body);
      const { x, y } = body.position;
      const closestX = Math.max(exit.x, Math.min(x, exit.x + exit.width));
      const closestY = Math.max(exit.y, Math.min(y, exit.y + exit.height));
      return (x - closestX) ** 2 + (y - closestY) ** 2 <= this.level.ball.radius ** 2;
    }
    // Matter's cached bounds include a velocity margin; goals use the visible shape.
    const { min, max } = actorBounds(body, this.level);
    const slop = .5; // Subpixel contact penetration must not prevent a visibly settled capture.
    const inside = min.x >= exit.x - slop && max.x <= exit.x + exit.width + slop
      && min.y >= exit.y - slop && max.y <= exit.y + exit.height + slop;
    const speed = Math.hypot(body.velocity.x, body.velocity.y) * 60 / this.level.viewport.pixelsPerMetre;
    this.heldSeconds = inside && speed <= this.condition.maxSpeed ? this.heldSeconds + seconds : 0;
    const complete = this.heldSeconds + 1e-9 >= this.condition.seconds;
    if (complete) this.heldSeconds = this.condition.seconds;
    return complete;
  }

  private overlaps(body: Matter.Body) {
    const { x, y, width, height } = this.level.exit, { min, max } = actorBounds(body, this.level);
    return max.x >= x && min.x <= x + width && max.y >= y && min.y <= y + height;
  }

}
