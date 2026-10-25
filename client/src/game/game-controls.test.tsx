// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { advance, button, click, lab, manage, queue, rows, startGame } from '../test/game-harness';

describe('pause, teaching, retry and completion', () => {
  it('does not start an untouched level when leaving the pause menu', async () => {
    await startGame();
    await click('Pause menu');
    await click('Back to game');
    await advance(240);
    expect(lab().world.started).toBe(false);
    expect(screen.getByTestId('time-left').textContent).toBe('30s');
  });

  it('pauses with Escape and resumes without spending paused simulation time', async () => {
    await startGame();
    await queue('add gravity');
    await click('Send now');
    await advance(120);
    const tick = lab().world.tick, position = { ...lab().world.ball.position };
    fireEvent.keyDown(window, { key: 'Escape' });
    await advance(240);
    expect(lab().world.tick).toBe(tick);
    expect(lab().world.ball.position).toEqual(position);
    fireEvent.keyDown(window, { key: 'Escape' });
    await advance(120);
    expect(lab().world.tick).toBe(tick + 120);
  });

  it('does not resume from Escape while AI is still preparing', async () => {
    await startGame();
    await queue('add gravity');
    await click('Send now');
    await queue('Please make the downward pull gentle.');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(button('Resume').disabled).toBe(true);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(lab().world.running).toBe(false);
  });

  it('requires Continue after rules are sent during teaching and preserves seen teaching on retry', async () => {
    await startGame('reality-breakdown');
    await click('Load starter messages ↳');
    await manage();
    await click('Select ready');
    await click('Send all selected');
    await click('Done');
    await advance(600);
    expect(lab().world.tutorialId).toBe('toaster-charge');
    const tick = lab().world.tick;
    await queue('Set fan power to 0.5');
    await click('Send now');
    await advance(120);
    expect(lab().world.running).toBe(false);
    expect(lab().world.tick).toBe(tick);
    await click('Continue →');
    await advance(72);
    expect(lab().world.devices.firedSprings.has('spring-main')).toBe(true);
    await click('Try again');
    expect(rows()).toHaveLength(5);
    expect(lab().world.seenTutorials.has('toaster-charge')).toBe(true);
    expect(lab().world.commandCount).toBe(0);
    expect(lab().world.tick).toBe(0);
    await click('Pause menu');
    await click('Replay teaching');
    expect(lab().world.seenTutorials.size).toBe(0);
    await manage();
    await click('Select ready');
    await click('Send all selected');
    await advance(600);
    expect(lab().world.tutorialId).toBe('toaster-charge');
  });

  it.each([
    ['bounce', 'Set surface bounce to 0.9', 'won'],
    ['gravity-lab', 'stop gravity', 'timedOut'],
    ['breeze', 'Set fan power to -2', 'fell'],
  ] as const)('locks execution after %s ends with %s / %s, then restores a fresh attempt', async (level, command, outcome) => {
    await startGame(level);
    await queue(command);
    await click('Send now');
    await advance(7200);
    expect(lab().world[outcome]).toBe(true);
    const count = lab().world.commandCount, tick = lab().world.tick;
    await queue(command);
    expect(button('Send now').disabled).toBe(true);
    await click('Send now');
    expect(lab().world.commandCount).toBe(count);
    expect(lab().world.tick).toBe(tick);
    await act(async () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Try again' })));
    expect(lab().world.started).toBe(false);
    expect(lab().world.commandCount).toBe(0);
    expect(lab().world.won).toBe(false);
    expect(lab().world.timedOut).toBe(false);
    expect(lab().world.fell).toBe(false);
    expect(screen.getByTestId('time-left').textContent).toBe('30s');
    expect(button('Send now').disabled).toBe(false);
  });
});
