// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { click, lab, queue, rows, startGame } from '../test/game-harness';

const send = (index: number) => within(rows()[index]).getByRole<HTMLButtonElement>('button', { name:'Send now' });

describe('direct message controls', () => {
  it('shows send and delete on every row without opening Manage', async () => {
    await startGame();
    for (const text of ['add gravity','stop gravity','reverse gravity']) await queue(text);
    expect(screen.getByRole('button',{name:'Manage'}).getAttribute('aria-expanded')).toBe('false');
    for (const [index,row] of rows().entries()) {
      expect(within(row).getByRole<HTMLButtonElement>('button',{name:'Send now'}).disabled).toBe(false);
      expect(within(row).getByRole('button',{name:`Delete message ${index+1}`})).toBeTruthy();
    }
  });

  it('sends the chosen row only, then evaluates a relative rule against the actual state', async () => {
    await startGame();
    for (const text of ['Set gravity to 2','reverse gravity','Set gravity to 3']) await queue(text);
    await act(async () => fireEvent.click(send(2)));
    expect(lab().world.gravity).toBe(3);
    expect(lab().world.running).toBe(true);
    expect(rows()).toHaveLength(2);
    expect(rows()[0].textContent).toContain('Set gravity to 2');
    await act(async () => fireEvent.click(send(1)));
    expect(lab().world.gravity).toBe(-3);
    expect(lab().world.commandCount).toBe(2);
    expect(rows()).toHaveLength(1);
  });

  it('lets a ready row run while preserving an invalid earlier message', async () => {
    await startGame('toaster');
    await queue('Set conveyor speed to 1');
    await queue('Set toaster power to 2');
    expect(send(0).disabled).toBe(true);
    expect(send(1).disabled).toBe(false);
    await act(async () => fireEvent.click(send(1)));
    expect(lab().world.rules.values['spring-main'].spring_power).toBe(2);
    expect(lab().world.commandCount).toBe(1);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Needs editing');
  });

  it('deletes the middle and first messages without applying rules', async () => {
    await startGame();
    for (const text of ['add gravity','stop gravity','reverse gravity']) await queue(text);
    await click('Delete message 2');
    expect(rows().map(row=>row.textContent)).toEqual([expect.stringContaining('add gravity'),expect.stringContaining('reverse gravity')]);
    await click('Delete message 1');
    expect(rows()[0].textContent).toContain('reverse gravity');
    expect(lab().world.commandCount).toBe(0);
    expect(lab().world.started).toBe(false);
  });

  it('does not execute a consumed row twice during rapid clicks', async () => {
    await startGame();
    await queue('add gravity');
    await queue('reverse gravity');
    const original = send(0);
    await act(async () => { fireEvent.click(original); fireEvent.click(original); });
    expect(lab().world.commandCount).toBe(1);
    expect(lab().world.gravity).toBe(1);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('reverse gravity');
  });
});
