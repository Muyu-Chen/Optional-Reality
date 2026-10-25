// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { advance, click, lab, rows, startGame } from '../test/game-harness';
import { fullScoreSolution } from '../test/level-solutions';
import { loadJourney } from './journey-progress';

describe('expanded motion and collision journey', () => {
  it.each([
    ['bring-it-back', 'over-the-wall'],
    ['over-the-wall', 'side-door'],
    ['side-door', 'thread-the-gap'],
    ['thread-the-gap', 'down-the-chimney'],
    ['down-the-chimney', 'hook-turn'],
    ['hook-turn', 'bank-shot'],
    ['bank-shot', 'bounce'],
    ['return-to-dock', 'one-last-bounce'],
    ['one-last-bounce', 'double-bank'],
    ['double-bank', 'low-roof'],
    ['low-roof', 'mind-the-gap'],
    ['mind-the-gap', 'toaster'],
  ])('plays %s through the real queue, retains retry drafts, and advances to %s', async (id, next) => {
    const { api } = await startGame(id);
    const route = fullScoreSolution(lab().world.level);
    const transitions = route.transitions || (route.transition ? [route.transition] : []);
    await click('Load starter messages ↳');
    const draftCount = rows().length;
    for (const _message of route.initial) await click('Send now');
    if (!route.initial.length) await click('Start game');
    for (const transition of transitions) {
      await act(async () => {
        while (lab().world.running && !transition.when(lab().world)) lab().world.step();
        lab().report();
      });
      expect(lab().world.won).toBe(false);
      await click('Send now');
    }
    await advance(3600);
    expect(lab().world.won).toBe(true); expect(lab().world.stars.fullScore).toBe(true);
    expect(loadJourney().completed[id]).toBe(3);
    expect(api.pending).toHaveLength(0);
    await act(async () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Try again' })));
    expect(lab().world.started).toBe(false); expect(lab().world.tick).toBe(0);
    expect(lab().world.stars.collected.size).toBe(0);
    expect(rows()).toHaveLength(draftCount);
    expect(rows().every(row => row.textContent?.includes('Ready'))).toBe(true);
    expect(loadJourney().completed[id]).toBe(3);
    // Replay the retained queue, including the separate Start action for the drift puzzle.
    for (const _message of route.initial) await click('Send now');
    if (!route.initial.length) await click('Start game');
    for (const transition of transitions) {
      await act(async () => {
        while (lab().world.running && !transition.when(lab().world)) lab().world.step();
        lab().report();
      });
      await click('Send now');
    }
    await advance(3600); await click('Next level →');
    expect(lab().world.level.id).toBe(next);
    expect(lab().world.tick).toBe(0); expect(lab().world.started).toBe(false);
    expect(api.pending).toHaveLength(0);
  });
});
