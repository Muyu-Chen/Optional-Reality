import type { PhysicsWorld } from '../physics/world';
import type { ExitTransitionPhase } from '../physics/exit-transition';
import { emitGameSound, type GameSoundEvent } from './game-sound-events';

// Compare real simulation events, rather than inferring pickups from visual animation.
export class SceneSoundEvents {
  private collected: Set<string>;
  private springs = new Map<string, string>();
  private exit: ExitTransitionPhase = 'idle';
  private disposed = false;
  constructor(private world: PhysicsWorld, private emit: (event: GameSoundEvent) => void = emitGameSound) {
    this.collected = new Set(world.stars.collected);
    for (const [id, state] of world.devices.springs) this.springs.set(id, state.phase);
  }
  capture() {
    if (this.disposed) return;
    for (const id of this.world.stars.collected) if (!this.collected.has(id)) {
      this.collected.add(id);this.emit({ kind: 'star', collected: this.collected.size });
    }
    for (const [id, state] of this.world.devices.springs) {
      if (state.phase === 'launched' && this.springs.get(id) !== 'launched') this.emit({ kind: 'spring' });
      this.springs.set(id, state.phase);
    }
  }
  transition(phase: ExitTransitionPhase) {
    if (this.disposed || phase === this.exit) return;
    this.exit = phase;
    if (phase === 'absorbing') this.emit({ kind: 'exit' });
    else if (phase === 'complete') this.emit({ kind: 'complete' });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;this.emit({ kind: 'cancel' });
  }
}
