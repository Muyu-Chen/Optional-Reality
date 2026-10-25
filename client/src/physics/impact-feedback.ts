import Matter from 'matter-js';
import { incomingMotion, measureImpact, type IncomingMotion } from './impact-contact';
import { ImpactState } from './impact-state';
import { physicsColours } from './visual-language';
import { STEP_MS, type PhysicsWorld } from './world';

/** Observes real pre-solve contacts without changing physics or creating another clock. */
export class ImpactFeedback {
  readonly state = new ImpactState();
  private incoming?: IncomingMotion;
  private disposed = false;
  constructor(private readonly world: PhysicsWorld) {
    Matter.Events.on(world.engine, 'beforeSolve', this.beforeSolve);
    Matter.Events.on(world.engine, 'collisionStart', this.collisionStart);
  }
  advance(reduced = false) { if (!this.disposed) this.state.advance(this.world.tick * STEP_MS / 1000, reduced); }

  private beforeSolve = () => {
    this.incoming = this.world.running && !this.disposed ? incomingMotion(this.world.ball) : undefined;
  };
  private collisionStart = (event: Matter.IEventCollision<Matter.Engine>) => {
    if (this.disposed || !this.world.running || !this.incoming) return;
    const contacts = event.pairs.flatMap(pair => {
      const other = pair.collision.parentA === this.world.ball ? pair.collision.parentB : pair.collision.parentA;
      const track = this.world.level.tracks.find(track => track.id === other.label);
      const colour = track?.feature ? physicsColours[track.feature] : physicsColours.structure;
      const contact = measureImpact(pair, this.world.ball, this.incoming!, this.world.level.viewport.pixelsPerMetre, colour);
      return contact ? [contact] : [];
    }).sort((a, b) => b.speed - a.speed);
    // Adjacent curve segments/corner supports can start together; show the dominant contact.
    if (contacts[0]) this.state.record(contacts[0], this.world.engine.timing.timestamp / 1000);
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    Matter.Events.off(this.world.engine, 'beforeSolve', this.beforeSolve);
    Matter.Events.off(this.world.engine, 'collisionStart', this.collisionStart);
    this.incoming = undefined; this.state.clear();
  }
}
