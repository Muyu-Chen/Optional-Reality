// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { click, lab, manage, queue, startGame } from '../test/game-harness';

describe('HUD acceleration follows applied rules', () => {
  it('shows execution, relative reversal, diagonal components, Undo and Try again from real telemetry', async () => {
    const { api } = await startGame();
    expect(screen.getByRole('status', { name: 'Acceleration: zero, 0 meters per second squared.' })).toBeTruthy();
    await queue('Set gravity to 2');await click('Send now');
    expect(screen.getByRole('status', { name: 'Acceleration: 2 meters per second squared, downward.' })).toBeTruthy();
    await queue('reverse gravity');await click('Send now');
    expect(lab().world.rules.acceleration).toEqual({ x: 0, y: -2 });
    expect(screen.getByRole('status', { name: 'Acceleration: 2 meters per second squared, upward.' })).toBeTruthy();
    await queue('add acceleration rightward');await click('Send now');
    expect(lab().world.rules.acceleration).toEqual({ x: 1, y: -2 });
    expect(screen.getByRole('status', { name: 'Acceleration: 2.236 meters per second squared, up and right. Components x 1, y -2.' })).toBeTruthy();
    await manage();await click('Undo last rule');
    expect(screen.getByRole('status', { name: 'Acceleration: 2 meters per second squared, upward.' })).toBeTruthy();
    await click('Try again');
    expect(screen.getByRole('status', { name: 'Acceleration: zero, 0 meters per second squared.' })).toBeTruthy();
    expect(lab().world.rules.acceleration).toEqual({ x: 0, y: 0 });expect(api.pending).toHaveLength(0);
  });
});
