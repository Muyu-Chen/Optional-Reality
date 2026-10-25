// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { button, click, lab, manage, queue, rows, startGame } from '../test/game-harness';
import { bounce } from '../levels/bounce';
import { messageStorageKey } from '../domain/message-storage';

const freeText = 'Please let the world pull down gently.';
const gravity = [{ type: 'set_gravity' as const, acceleration: 1 }];

describe('AI preparation and player action races', () => {
  it('pauses before the network response and applies nothing until Send now', async () => {
    const { api } = await startGame();
    await queue('add gravity');
    await click('Send now');
    lab().world.step();
    const tick = lab().world.tick, before = structuredClone(lab().world.rules);
    await queue(freeText);
    expect(lab().world.running).toBe(false);
    expect(button('Send now').disabled).toBe(true);
    for (let i = 0; i < 240; i++) lab().world.step();
    expect(lab().world.tick).toBe(tick);
    expect(lab().world.rules).toEqual(before);
    await api.complete(0, [{ type: 'set_gravity', acceleration: 0 }]);
    expect(lab().world.running).toBe(false);
    expect(lab().world.gravity).toBe(1);
    await click('Send now');
    expect(lab().world.gravity).toBe(0);
    expect(lab().world.running).toBe(true);
    expect(lab().world.commandCount).toBe(2);
  });

  it('ignores a late result after a pending message is edited to a local command', async () => {
    const { api } = await startGame();
    await queue(freeText);
    await manage();
    await click('Edit message 1');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'stop gravity' } });
    await click('Save ↳');
    expect(api.pending[0].signal.aborted).toBe(true);
    await api.complete(0, gravity);
    expect(rows()[0].textContent).toContain('stop gravity');
    await click('Send now');
    expect(lab().world.gravity).toBe(0);
    expect(lab().world.commandCount).toBe(1);
  });

  it.each(['Delete message 1', 'Clear messages'])('discards a result after %s', async action => {
    const { api } = await startGame();
    await queue(freeText);
    await manage();
    await click(action);
    await queue('stop gravity');
    await api.complete(0, gravity);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('stop gravity');
    expect(lab().world.commandCount).toBe(0);
    expect(api.pending[0].signal.aborted).toBe(true);
  });

  it('ignores the previous attempt while a retried draft is preparing', async () => {
    const { api } = await startGame();
    await queue(freeText);
    await click('Try again');
    expect(api.pending).toHaveLength(2);
    expect(api.pending[0].signal.aborted).toBe(true);
    await api.complete(0, gravity);
    expect(button('Send now').disabled).toBe(true);
    expect(rows()[0].textContent).toContain('Interpreting');
    await api.complete(1, [{ type: 'set_gravity', acceleration: 2 }]);
    await click('Send now');
    expect(lab().world.gravity).toBe(2);
  });

  it('does not let an old request failure clear a newer request or replace its feedback', async () => {
    const { api } = await startGame();
    await queue(freeText);
    await manage();
    await click('Edit message 1');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Make the downward pull gentle, please.' } });
    await click('Save ↳');
    expect(api.pending).toHaveLength(2);
    await act(async () => api.pending[0].reject(new Error('OLD REQUEST ERROR')));
    expect(screen.queryByText('OLD REQUEST ERROR')).toBeNull();
    expect(button('Send now').disabled).toBe(true);
    await api.complete(1, gravity);
    expect(button('Send now').disabled).toBe(false);
  });

  it('aborts on level change and cannot write a previous level’s result into the new queue', async () => {
    localStorage.setItem(messageStorageKey(bounce), '[]');
    const { api } = await startGame();
    await queue(freeText);
    const previous = lab();
    await click('Pause menu');
    fireEvent.click(screen.getByText('Choose a level'));
    await click('02.2 · A Little More Bounce');
    expect(previous.destroyed).toBe(true);
    expect(api.pending[0].signal.aborted).toBe(true);
    await api.complete(0, gravity);
    expect(rows()).toHaveLength(0);
    expect(lab().world.level.id).toBe('bounce');
    expect(lab().world.gravity).toBe(1);
    expect(lab().world.commandCount).toBe(0);
  });

  it('aborts in-flight work and destroys the world when the game unmounts', async () => {
    const { api, unmount } = await startGame();
    await queue(freeText);
    const previous = lab();
    unmount();
    expect(api.pending[0].signal.aborted).toBe(true);
    expect(previous.destroyed).toBe(true);
    await api.complete(0, gravity);
    expect(document.body.textContent).toBe('');
  });

  it('retries parsed AI operations without another request and clears previous feedback', async () => {
    const { api } = await startGame();
    await queue(freeText);
    await api.complete(0, gravity);
    await click('Send now');
    expect(screen.getByText('Acceleration now pulls downward at 1 m/s².')).toBeTruthy();
    await click('Try again');
    expect(api.pending).toHaveLength(1);
    expect(lab().world.tick).toBe(0);
    expect(lab().world.commandCount).toBe(0);
    expect(lab().world.gravity).toBe(0);
    expect(screen.queryByText('Acceleration now pulls downward at 1 m/s².')).toBeNull();
    expect(button('Send now').disabled).toBe(false);
    await click('Send now');
    expect(lab().world.gravity).toBe(1);
  });
});
