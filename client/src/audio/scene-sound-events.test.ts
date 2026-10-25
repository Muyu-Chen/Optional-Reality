import Matter from 'matter-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { oneMoreTurn } from '../levels/one-more-turn';
import { PhysicsWorld } from '../physics/world';
import { SceneSoundEvents } from './scene-sound-events';
import { emitGameSound, subscribeGameSounds, type GameSoundEvent } from './game-sound-events';

const worlds: PhysicsWorld[] = [];
afterEach(() => worlds.splice(0).forEach(world => world.destroy()));
function create(level = gravityLab) {
  const world = new PhysicsWorld(level);worlds.push(world);
  const events: GameSoundEvent[] = [], sounds = new SceneSoundEvents(world, event => events.push(event));
  return { world, sounds, events };
}
function collect(world: PhysicsWorld, index: number) {
  const [x, y] = world.level.stars![index].position;
  Matter.Body.setPosition(world.ball, { x, y });world.stars.update(world.ball, [x, y]);
}

describe('sound cues from real scene changes', () => {
  it('emits one ascending pickup cue for each newly collected star and never repeats old pickups', () => {
    const { world, sounds, events } = create();sounds.capture();
    expect(events).toEqual([]);
    collect(world, 0);sounds.capture();sounds.capture();
    collect(world, 1);collect(world, 2);sounds.capture();
    world.pause();world.step();sounds.capture();
    expect(events).toEqual([
      { kind: 'star', collected: 1 }, { kind: 'star', collected: 2 }, { kind: 'star', collected: 3 },
    ]);
  });

  it('baselines an existing score and cancels old attempt audio instead of replaying it', () => {
    const { world, sounds, events } = create();collect(world, 0);
    sounds.dispose();sounds.dispose();sounds.capture();
    expect(events).toEqual([{ kind: 'cancel' }]);
    const fresh = new SceneSoundEvents(world, event => events.push(event));fresh.capture();
    expect(events).toHaveLength(1);
    collect(world, 1);fresh.capture();
    expect(events.at(-1)).toEqual({ kind: 'star', collected: 2 });
  });

  it('plays a spring cue on the actual elastic release, rather than on contact or while paused', () => {
    const { world, sounds, events } = create(oneMoreTurn);world.setGravity(1);world.start();
    for (let tick = 0; tick < 600 && !world.devices.firedSprings.has('fixed-spring'); tick++) {
      world.step();sounds.capture();
    }
    expect(world.devices.firedSprings.has('fixed-spring')).toBe(true);
    expect(world.ball.velocity.y).toBeLessThan(0);
    expect(events.filter(event => event.kind === 'spring')).toHaveLength(1);
    world.pause();world.step();sounds.capture();sounds.capture();
    expect(events.filter(event => event.kind === 'spring')).toHaveLength(1);
  });

  it('emits absorption and completion once, including the reduced-motion direct completion path', () => {
    const { sounds, events } = create();
    sounds.transition('idle');sounds.transition('absorbing');sounds.transition('absorbing');
    sounds.transition('complete');sounds.transition('complete');
    expect(events).toEqual([{ kind: 'exit' }, { kind: 'complete' }]);
    sounds.dispose();sounds.transition('complete');
    expect(events.at(-1)).toEqual({ kind: 'cancel' });
    const reduced = create();reduced.sounds.transition('complete');
    expect(reduced.events).toEqual([{ kind: 'complete' }]);
  });

  it('isolates optional audio failures and unsubscribes event listeners', () => {
    const broken = subscribeGameSounds(() => { throw new Error('Audio unavailable'); });
    const heard = vi.fn(), unsubscribe = subscribeGameSounds(heard);
    expect(() => emitGameSound({ kind: 'star', collected: 1 })).not.toThrow();
    expect(heard).toHaveBeenCalledExactlyOnceWith({ kind: 'star', collected: 1 });
    unsubscribe();broken();emitGameSound({ kind: 'cancel' });
    expect(heard).toHaveBeenCalledOnce();
  });
});
