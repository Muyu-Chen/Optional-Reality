// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { click, lab, queue, rows, startGame } from '../test/game-harness';

async function finishWithAbsorption() {
  const view = await startGame('bounce');
  await queue('surface bounce 0.9');await queue('stop gravity');await click('Send now');
  await act(async () => {
    for (let tick = 0; tick < 3600; tick++) lab().world.step();
    lab().report('absorbing');
  });
  expect(lab().world.won).toBe(true);
  return view;
}

describe('exit absorption before the result menu', () => {
  it('keeps the physical result but blocks input, sending and menus until the visual sequence completes', async () => {
    const { api } = await finishWithAbsorption();
    const result = lab().world.snapshot(), count = lab().world.commandCount;
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Send now' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Pause menu' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('region', { name: 'Message queue' }).closest('[inert]')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    await queue('add gravity');
    expect(rows()).toHaveLength(1);expect(api.pending).toHaveLength(0);
    expect(lab().world.commandCount).toBe(count);expect(lab().world.snapshot()).toEqual(result);
    await act(async () => lab().report('complete'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Exit reached. Collect every star for full score.')).toBeTruthy();
    expect(lab().world.snapshot()).toEqual(result);
  });

  it('permits retrying during absorption without showing the old result afterward', async () => {
    await finishWithAbsorption();await click('Try again');
    expect(lab().world.won).toBe(false);expect(lab().isAbsorbing).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(false);
    expect(rows()).toHaveLength(2);
    expect(screen.getByLabelText('Stars 0 of 3')).toBeTruthy();
  });

  it('ignores an old completion after unmount and keeps next-level navigation available after completion', async () => {
    const view = await finishWithAbsorption(), old = lab();
    await act(async () => old.report('complete'));
    await act(async () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Next level →' })));
    expect(lab().world.level.id).toBe('multi-bounce');expect(old.destroyed).toBe(true);
    await act(async () => old.report('complete'));
    expect(screen.queryByRole('dialog')).toBeNull();
    view.unmount();
  });
});
