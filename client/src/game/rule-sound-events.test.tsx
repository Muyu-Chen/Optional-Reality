// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { subscribeGameSounds, type GameSoundEvent } from '../audio/game-sound-events';
import { click, lab, manage, queue, startGame } from '../test/game-harness';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()));
function hear() {
  const events: GameSoundEvent[] = [];
  cleanups.push(subscribeGameSounds(event => events.push(event)));
  return events;
}

describe('rule confirmation sounds follow execution', () => {
  it('is silent while preparing and emits one confirmation for a successful batch', async () => {
    await startGame();const events = hear();
    await queue('add gravity');await queue('stop gravity');
    expect(events).toEqual([]);
    await manage();await click('Select ready');await click('Send all selected');
    expect(lab().world.commandCount).toBe(2);
    expect(events.filter(event => event.kind === 'rule')).toHaveLength(1);
  });

  it('does not play success for invalid AI output or a rule rejected by the current scene', async () => {
    const { api } = await startGame();const events = hear();
    await queue('Give the protected ball a big jump.');
    expect(api.pending).toHaveLength(1);
    await api.complete(0, [{ type: 'set_property', target: 'ball-A', property: 'acceleration_y', value: -1 }]);
    const article = screen.getByRole('article');
    expect((within(article).getByRole('button', { name: 'Send now' }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => fireEvent.click(within(article).getByRole('button', { name: 'Send now' })));
    expect(lab().world.commandCount).toBe(0);expect(events.filter(event => event.kind === 'rule')).toHaveLength(0);
  });
});
