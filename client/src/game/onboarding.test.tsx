// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { onboardingFor, onboardingStorageKey } from '../levels/onboarding';
import { advance, click, ControlledApi, lab, queue, rows, startGame } from '../test/game-harness';

const intro = (level = 'gravity-lab') => screen.getByRole('dialog', { name: onboardingFor(level)!.title });
const write = (text: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
async function fresh(level = 'gravity-lab') { return startGame(level, new ControlledApi(), [], true); }

describe('first two level onboarding', () => {
  it.each(['gravity-lab', 'one-more-turn'])('shows a full-scene lesson for a fresh %s without starting or applying a rule', async level => {
    const { api } = await fresh(level), modal = intro(level);
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.parentElement?.className).toBe('onboarding-scrim');
    expect(within(modal).getAllByRole('listitem')).toHaveLength(3);
    expect(localStorage.getItem(onboardingStorageKey(level))).toBe('seen');
    expect(document.activeElement).toBe(within(modal).getByRole('button', { name: "Let's play" }));
    expect(screen.getByRole('textbox').closest('[inert]')).toBeTruthy();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true);
    await queue('add gravity');
    await act(async () => fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true }));
    await advance(3600);
    expect(rows()).toHaveLength(0);expect(api.pending).toHaveLength(0);
    expect(lab().world.tick).toBe(0);expect(lab().world.started).toBe(false);
    expect(screen.getByTestId('time-left').textContent).toBe('30s');
    await click("Let's play");
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(lab().world.running).toBe(false);expect(lab().world.commandCount).toBe(0);
  });

  it.each(['gravity-lab', 'one-more-turn'])('can load two prepared starter messages for %s without applying them', async level => {
    const { api } = await fresh(level);await click('Load starter messages');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(rows()).toHaveLength(2);expect(rows().every(row => row.textContent?.includes('Ready'))).toBe(true);
    expect(api.pending).toHaveLength(0);expect(lab().world.commandCount).toBe(0);
    await advance(3600);expect(lab().world.tick).toBe(0);expect(lab().world.running).toBe(false);
    await click('Send now');expect(lab().world.started).toBe(true);
  });

  it('remembers each lesson across retry and refresh, while keeping the other level unseen', async () => {
    const view = await fresh();await click('Load starter messages');await click('Send now');await advance(30);
    await click('Try again');expect(screen.queryByRole('dialog')).toBeNull();expect(lab().world.tick).toBe(0);
    view.unmount();const revisit = await fresh();expect(screen.queryByRole('dialog')).toBeNull();
    revisit.unmount();await fresh('one-more-turn');expect(intro('one-more-turn')).toBeTruthy();
  });

  it('does not auto-open the lesson after it was displayed even when the first visit is refreshed before confirmation', async () => {
    const view = await fresh();expect(intro()).toBeTruthy();view.unmount();
    await fresh();expect(screen.queryByRole('dialog')).toBeNull();expect(lab().world.started).toBe(false);
  });

  it('never auto-opens these lessons in later levels without a lesson', async () => {
    await fresh('multi-bounce');expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Escape dismisses without starting, while Shift+Tab goes to settings and remains paused', async () => {
    await fresh();fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();expect(lab().world.started).toBe(false);
    await click('Pause menu');await click('How to play');expect(intro()).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('dialog', { name: 'Paused.' })).toBeTruthy();
    expect(lab().world.running).toBe(false);expect(lab().world.tick).toBe(0);
    await click('How to play');await click("Let's play");
    expect(screen.getByRole('dialog', { name: 'Paused.' })).toBeTruthy();
  });

  it('reopens from settings and returns there with the same paused attempt and messages', async () => {
    await startGame();await queue('add gravity');await click('Send now');await advance(40);
    const before = lab().world.snapshot();await click('Pause menu');await click('How to play');
    expect(intro()).toBeTruthy();await advance(1000);await click("Let's play");
    expect(screen.getByRole('dialog', { name: 'Paused.' })).toBeTruthy();
    expect(lab().world.tick).toBe(before.tick);expect(lab().world.commandCount).toBe(1);
    expect(lab().world.running).toBe(false);
  });

  it.each([false, true])('cancels automatic apply when teaching opens and the AI resolves after close: %s', async closeBeforeResponse => {
    const { api } = await startGame();write('Please make the downward pull gentle.');
    await act(async () => fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true }));
    expect(api.pending).toHaveLength(1);
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });await click('How to play');
    if (closeBeforeResponse) await click("Let's play");
    await api.complete(0, [{ type: 'set_gravity', acceleration: 1 }]);
    expect(lab().world.started).toBe(false);expect(lab().world.commandCount).toBe(0);expect(lab().world.gravity).toBe(0);
    expect(rows()).toHaveLength(1);expect(rows()[0].textContent).toContain('Ready');
    if (!closeBeforeResponse) { expect(intro()).toBeTruthy();await click("Let's play"); }
    expect(screen.getByRole('dialog', { name: 'Paused.' })).toBeTruthy();
    await click('Back to game');await click('Send now');expect(lab().world.commandCount).toBe(1);
  });

  it('keeps dismissal for this mount if storage cannot be read or written', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    await fresh();expect(intro()).toBeTruthy();await click("Let's play");await click('Try again');
    expect(screen.queryByRole('dialog')).toBeNull();
    await click('Pause menu');await click('How to play');expect(intro()).toBeTruthy();
    await click("Let's play");expect(screen.getByRole('dialog', { name: 'Paused.' })).toBeTruthy();
  });

  it('shows the second lesson after choosing that unseen level without restarting either world', async () => {
    await fresh();await click("Let's play");await click('Pause menu');
    fireEvent.click(screen.getByText('Choose a level'));await click('01.2 · One More Turn');
    expect(intro('one-more-turn')).toBeTruthy();expect(lab().world.started).toBe(false);
  });
});
