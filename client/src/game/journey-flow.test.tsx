// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControlledApi, advance, click, lab, queue, rows, startGame } from '../test/game-harness';
import App from '../App';
import { JOURNEY_STORAGE_KEY, loadJourney } from './journey-progress';
import { findLevel, levels } from '../levels/catalog';
import { onboardingFor, onboardingStorageKey } from '../levels/onboarding';

async function openFrontDoor(search = '') {
  const api = new ControlledApi();
  vi.stubGlobal('fetch', api.fetch);
  window.history.replaceState(null, '', `/demo/${search}`);
  const view = render(<App />, { reactStrictMode: true });
  await act(async () => {});
  return { ...view, api };
}
function skipIntros() {
  for (const level of levels) if (onboardingFor(level.id)) localStorage.setItem(onboardingStorageKey(level.id), 'seen');
}

describe('title screen and chapter selection', () => {
  it.each(['', '?level=bounce'])('shows phone introduction without starting physics at %s', async search => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const { api } = await openFrontDoor(search);
    expect(screen.getByRole('heading', { name: /You don’t move the ball/ })).toBeTruthy();
    expect(screen.getByText('Desktop only')).toBeTruthy();
    await click('Let’s play');
    expect(screen.getByRole('alert').textContent).toContain('cannot be played on a phone');
    expect(document.querySelector('canvas')).toBeNull();
    expect(api.fetch).not.toHaveBeenCalled();
    expect(window.location.search).toBe(search);
  });
  it('reopens the beginner tutorial from title settings without starting a game', async () => {
    skipIntros(); const { api } = await openFrontDoor();
    await click('Settings'); await click('Replay beginner tutorial');
    expect(screen.getByRole('dialog', { name: onboardingFor('gravity-lab')!.title })).toBeTruthy();
    expect(document.querySelector('canvas')).toBeNull();
    expect(api.fetch).not.toHaveBeenCalled();
    await click('Back to settings');
    expect(screen.getByRole('dialog', { name: 'Set the mood.' })).toBeTruthy();
    await click('Replay beginner tutorial');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Set the mood.' })).toBeTruthy();
  });
  it('opens a real title screen at /demo/ without starting a hidden world or requesting AI', async () => {
    const { api } = await openFrontDoor();
    expect(screen.getByRole('heading', { name: 'Reality is optional.' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Let’s play' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /little green ball leaps/ })).toBeTruthy();
    expect(document.querySelector('canvas')).toBeNull();
    expect(api.fetch).not.toHaveBeenCalled();
    expect(document.title).toBe('Change the rules — Optional Reality');
  });
  it('starts the first level, then offers the most recently visited level without claiming a saved simulation', async () => {
    skipIntros(); await openFrontDoor(); await click('Let’s play');
    expect(lab().world.level.id).toBe('gravity-lab');
    const old = lab(); await click('Title screen');
    expect(old.destroyed).toBe(true);
    expect(screen.getByRole('button', { name: 'Continue journey' })).toBeTruthy();
    expect(screen.getByText(/A fresh attempt; your messages stay with you/)).toBeTruthy();
    await click('Continue journey');
    expect(lab()).not.toBe(old); expect(lab().world.tick).toBe(0); expect(lab().world.started).toBe(false);
  });
  it('offers all fifteen levels across three chapters, with real previews and no invented locks', async () => {
    await openFrontDoor(); await click('Choose a level');
    expect(window.location.search).toBe('?view=levels');
    const chapters = within(screen.getByRole('navigation', { name: 'Chapters' }));
    const seen = new Set<string>();
    for (const [name, count] of [['Motion', 5], ['Collisions', 7], ['Devices', 3]] as const) {
      await act(async () => fireEvent.click(chapters.getByRole('button', { name: new RegExp(name) })));
      const buttons = screen.getAllByRole('button', { name: /^Play \d/ });
      expect(buttons).toHaveLength(count);
      for (const button of buttons) {
        expect(button.querySelector('svg.level-preview')).toBeTruthy();
        expect(button.hasAttribute('disabled')).toBe(false); seen.add(button.getAttribute('aria-label')!);
      }
    }
    expect(seen.size).toBe(15);
    await click('Play 03.3 The Last Order');
    expect(lab().world.level.id).toBe('reality-breakdown');
    expect(window.location.search).toBe('?level=reality-breakdown');
  });
  it('keeps direct links in game and sends unknown links to a safe selection screen', async () => {
    const { unmount } = await startGame('bounce');
    expect(screen.getByRole('heading', { name: 'A Little More Bounce' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue journey' })).toBeNull();
    unmount(); await openFrontDoor('?level=does-not-exist');
    expect(screen.getByRole('heading', { name: 'Choose a possibility.' })).toBeTruthy();
    expect(document.querySelector('canvas')).toBeNull();
  });
  it('restores the last level and best stars after a fresh app mount', async () => {
    localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify({ version: 1, lastLevel: 'bounce', completed: { bounce: 2 } }));
    skipIntros(); await openFrontDoor('?view=levels');
    expect(screen.getByRole('button', { name: /Chapter 2 Collisions/ }).getAttribute('aria-current')).toBe('true');
    const bounceCard = screen.getByRole('button', { name: 'Play 02.2 A Little More Bounce' });
    expect(within(bounceCard).getByRole('img', { name: 'Best score 2 of 3 stars' })).toBeTruthy();
    expect(within(bounceCard).getByText('✓ Cleared')).toBeTruthy();
  });
  it('saves only completed scores, keeps a personal best across retries, and displays it in the gallery', async () => {
    await startGame('bounce'); await queue('Set surface bounce to 0.9'); await click('Send now');
    await advance(120); expect(loadJourney().completed.bounce).toBeUndefined();
    await advance(3480); expect(lab().world.won).toBe(true); expect(loadJourney().completed.bounce).toBe(1);
    await act(async () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Try again' })));
    expect(loadJourney().completed.bounce).toBe(1);
    await click('Pause menu');
    await act(async () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Level select' })));
    const card = screen.getByRole('button', { name: 'Play 02.2 A Little More Bounce' });
    expect(within(card).getByRole('img', { name: 'Best score 1 of 3 stars' })).toBeTruthy();
  });
  it('aborts an immediate AI request on leaving, preserves messages, and ignores its late response', async () => {
    const { api } = await startGame('bounce');
    const field = screen.getByRole('textbox');
    fireEvent.change(field, { target: { value: 'Please give the world a gentle upward pull.' } });
    await act(async () => fireEvent.keyDown(field, { key: 'Enter', shiftKey: true }));
    expect(api.pending).toHaveLength(1); const old = lab();
    await click('Title screen');
    expect(old.destroyed).toBe(true); expect(api.pending[0].signal.aborted).toBe(true);
    await api.complete(0, [{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -1 }]);
    expect(screen.getByRole('heading', { name: 'Reality is optional.' })).toBeTruthy();
    expect(old.world.started).toBe(false);
    await click('Continue journey');
    expect(lab().world.level.id).toBe('bounce'); expect(lab().world.started).toBe(false);
    expect(rows()).toHaveLength(1); expect(rows()[0].textContent).toContain('Please give the world');
    expect(api.pending).toHaveLength(2); // The preserved free-text draft gets its own new identity.
    await api.complete(0, [{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -20 }]);
    expect(lab().world.started).toBe(false); expect(lab().world.rules.acceleration.y).toBe(1);
  });
  it('handles browser popstate in both directions and destroys the departed game', async () => {
    await startGame('bounce'); const old = lab();
    await act(async () => {
      window.history.replaceState(null, '', '/demo/?view=levels'); window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(old.destroyed).toBe(true); expect(document.querySelector('canvas')).toBeNull();
    await act(async () => {
      window.history.replaceState(null, '', '/demo/?level=one-more-turn'); window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(lab().world.level.id).toBe('one-more-turn'); expect(lab().world.tick).toBe(0);
    await act(async () => {
      window.history.replaceState(null, '', '/demo/'); window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(lab().destroyed).toBe(true); expect(document.title).toBe('Change the rules — Optional Reality');
  });
  it('exposes settings with keyboard close and restores focus to its trigger', async () => {
    await openFrontDoor(); const trigger = screen.getByRole('button', { name: 'Settings' });
    // Pointer clicks need not focus a button on macOS; restoration still targets it.
    await click('Settings');
    const dialog = screen.getByRole('dialog', { name: 'Set the mood.' });
    expect(within(dialog).getByRole('button', { name: 'Turn music off' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Turn sound effects off' })).toBeTruthy();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Close settings' }));
    await act(async () => fireEvent.keyDown(window, { key: 'Escape' }));
    expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(trigger);
  });
  it('still starts and navigates when local storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    await openFrontDoor(); expect(screen.getByText(/Progress stays in this tab/)).toBeTruthy();
    await click('Let’s play'); const intro = screen.queryByRole('button', { name: "Let's play" });
    if (intro) await act(async () => fireEvent.click(intro));
    expect(lab().world.level.id).toBe(findLevel('gravity-lab')!.id);
    await click('Title screen'); expect(screen.getByRole('button', { name: 'Continue journey' })).toBeTruthy();
  });
});
