import type { LevelDefinition } from '../levels/types';
import type { PhysicsWorld } from '../physics/world';

export interface LevelSolution {
  initial: readonly string[];
  transition?: { when: (world: PhysicsWorld) => boolean; message: string };
}

/** Reproducible player actions only: no changes to bodies, velocities or scoring. */
export function fullScoreSolution(level: LevelDefinition): LevelSolution {
  switch (level.id) {
    case 'mind-the-gap': return { initial: [level.instructions.exampleMessages[0]], transitions: [
      { when: w => w.ball.position.x >= 320, message: level.instructions.exampleMessages[1] },
      { when: w => w.ball.position.x >= 400, message: level.instructions.exampleMessages[2] },
    ] };
    case 'gravity-lab': return { initial: ['add gravity'], transition: { when: w => w.ball.position.x >= 600, message: 'stop gravity' } };
    case 'one-more-turn': return { initial: ['add gravity'], transition: { when: w => !!w.devices.firedSprings.size && w.ball.velocity.y > 0 && w.ball.position.y >= 330, message: 'reverse gravity' } };
    case 'bring-it-back': return { initial: [], transition: { when: w => w.ball.position.x >= 500, message: 'acceleration leftward 1' } };
    case 'over-the-wall': return { initial: ['acceleration upward 0.2'], transition: { when: w => w.ball.position.x >= 300, message: 'reverse gravity' } };
    case 'side-door': return { initial: ['acceleration rightward 0.15'], transition: { when: w => w.ball.position.y >= 190, message: 'acceleration leftward 0.15' } };
    case 'bounce': return { initial: ['Set surface bounce to 0'], transition: { when: w => w.ball.position.x >= 490, message: 'acceleration upward 2' } };
    case 'multi-bounce': return { initial: ['Set surface bounce to 0.9'], transition: { when: w => w.tick >= 480, message: 'gravity downward 4' } };
    case 'friction-runway': return { initial: ['Set surface friction to 0'], transition: { when: w => w.ball.position.x >= 330, message: 'surface friction 0.3' } };
    case 'return-to-dock': return { initial: ['Set return wall bounce to 0.9'], transition: { when: w => w.ball.velocity.x < 0 && w.ball.position.x <= 500, message: 'Set surface friction to 0.3' } };
    case 'one-last-bounce': return { initial: ['Set surface bounce to 0.9'], transition: { when: w => w.tick >= 360, message: 'Set surface bounce to 0 and surface friction to 0.3' } };
    default: return { initial: level.instructions.exampleMessages };
  }
}
