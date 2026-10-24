// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { button, click, lab, manage, queue, rows, startGame } from '../test/game-harness';

describe('message queue through the game UI', () => {
  it('prepares without starting, then sends once and advances the queue', async () => {
    await startGame();
    await queue('add gravity');
    await queue('stop gravity');
    expect(lab().world.started).toBe(false);
    expect(lab().world.gravity).toBe(0);
    await click('Send now');
    expect(lab().world.running).toBe(true);
    expect(lab().world.commandCount).toBe(1);
    expect(lab().world.gravity).toBe(1);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('stop gravity');
    await click('Send now');
    expect(rows()).toHaveLength(0);
    expect(lab().world.commandCount).toBe(2);
    expect(lab().world.gravity).toBe(0);
    expect(screen.queryByRole('button', { name: 'Send now' })).toBeNull();
  });

  it('blocks an invalid head until it is edited, without skipping to a valid rule', async () => {
    await startGame('bounce');
    await queue('Set gravity to 99');
    await queue('Set surface bounce to 0.9');
    expect(button('Send now').disabled).toBe(true);
    expect(lab().world.commandCount).toBe(0);
    await click('Edit message 1');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Set surface bounce to 0.8' } });
    await click('Save ↳');
    await click('Send now');
    expect(lab().world.rules.values.world.restitution).toBe(.8);
    expect(rows()[0].textContent).toContain('Set surface bounce to 0.9');
  });

  it('applies selected rules in queue order and clears selection after sending', async () => {
    await startGame();
    await queue('Set gravity to 2');
    await queue('reverse gravity');
    await manage();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select message 2' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select message 1' }));
    await click('Send all selected');
    expect(lab().world.gravity).toBe(-2);
    expect(lab().world.commandCount).toBe(2);
    expect(button('Send all selected').disabled).toBe(true);
    await click('Undo last rule');
    expect(lab().world.gravity).toBe(2);
    expect(lab().world.commandCount).toBe(1);
    expect(rows()[0].textContent).toContain('reverse gravity');
  });

  it('reorders only pending messages while preserving sent history', async () => {
    await startGame();
    for (const text of ['add gravity', 'stop gravity', 'reverse gravity']) await queue(text);
    await click('Send now');
    await manage();
    await click('Move message 2 earlier');
    expect(rows()[0].textContent).toContain('reverse gravity');
    await click('Send now');
    expect(lab().world.gravity).toBe(-1);
    await click('Send now');
    expect(lab().world.gravity).toBe(0);
    expect(lab().world.commandCount).toBe(3);
  });

  it('cancels editing when clearing the queue so the next input is not lost', async () => {
    await startGame();
    await queue('add gravity');
    await manage();
    await click('Edit message 1');
    await click('Clear messages');
    expect(screen.queryByText('EDIT YOUR MESSAGE')).toBeNull();
    await queue('stop gravity');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('stop gravity');
  });

  it('prepares a previously sent AI message again when Queue again is chosen', async () => {
    const { api } = await startGame();
    await queue('Please let the world pull down gently.');
    await api.complete(0, [{ type: 'set_gravity', acceleration: 1 }]);
    await click('Send now');
    await manage();
    fireEvent.click(screen.getByText('Sent messages · 1'));
    await click('Queue again');
    expect(api.pending).toHaveLength(2);
    expect(rows()[0].textContent).toContain('Interpreting');
  });

  it('keeps the 24-message limit while allowing edits and freeing deleted slots', async () => {
    await startGame();
    for (let i = 0; i < 24; i++) await queue('add gravity');
    await queue('stop gravity');
    expect(rows()).toHaveLength(24);
    expect(button('Queue message ↳').disabled).toBe(true);
    await manage();
    await click('Edit message 1');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'stop gravity' } });
    await click('Save ↳');
    expect(rows()).toHaveLength(24);
    expect(rows()[0].textContent).toContain('stop gravity');
    await click('Delete message 1');
    await queue('reverse gravity');
    expect(rows()).toHaveLength(24);
  });

  it.each([{ shiftKey: true }, { isComposing: true }])('does not queue Enter while writing: %j', async key => {
    await startGame();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'add gravity' } });
    await act(async () => fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', ...key }));
    expect(rows()).toHaveLength(0);
  });

  it('restores a deleted sent message on undo without rewinding motion', async () => {
    await startGame();
    await queue('add gravity');
    await click('Send now');
    await manage();
    await click('Clear messages');
    lab().world.step();
    const position = { ...lab().world.ball.position };
    await click('Undo last rule');
    expect(lab().world.ball.position).toEqual(position);
    expect(lab().world.gravity).toBe(0);
    expect(rows()[0].textContent).toContain('add gravity');
  });
});
