// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { onboardingFor } from '../levels/onboarding';
import { advance, click, ControlledApi, lab, rows, startGame } from '../test/game-harness';

describe('bounce lesson distinguishes ordinary and three-star routes', () => {
  it.each([
    [null, 'Set surface bounce to 0.9'],
    [['stop gravity'], 'stop gravity'],
  ] as const)('preserves the existing queue when the lesson is acknowledged: %s', async (savedMessages, expected) => {
    const { api } = await startGame('bounce', new ControlledApi(), savedMessages, true);
    expect(screen.getByRole('dialog', { name: onboardingFor('bounce')!.title })).toBeTruthy();
    expect(rows()).toHaveLength(1);expect(rows()[0].textContent).toContain(expected);
    await click("Let's play");
    expect(rows()).toHaveLength(1);expect(rows()[0].textContent).toContain(expected);
    expect(lab().world.started).toBe(false);expect(lab().world.commandCount).toBe(0);expect(api.pending).toHaveLength(0);
  });

  it('loads the optional low-bounce setup only on request and completes all three stars with the taught landing timing', async () => {
    const { api } = await startGame('bounce', new ControlledApi(), null, true);
    await click('Load three-star setup');
    expect(screen.queryByRole('dialog')).toBeNull();expect(rows()).toHaveLength(2);
    expect(rows()[0].textContent).toContain('Set surface bounce to 0.1');
    expect(rows()[1].textContent).toContain('acceleration upward 1');
    await advance(120);expect(lab().world.tick).toBe(0);expect(lab().world.commandCount).toBe(0);
    await click('Send now');await advance(320);
    // The observed first landing precedes pickup; waiting for pickup is too late.
    expect(lab().world.stars.collected.size).toBe(0);expect(lab().world.ball.position.y).toBeGreaterThan(400);
    await click('Send now');await advance(3600);
    expect(lab().world.won).toBe(true);expect(lab().world.stars.fullScore).toBe(true);
    expect(screen.getByText('Full score. Every star collected.')).toBeTruthy();expect(api.pending).toHaveLength(0);
  });

  it('can review the lesson in settings and still use the original easy 0.9 route afterward', async () => {
    await startGame('bounce', new ControlledApi(), null);
    await click('Pause menu');await click('How to play');
    expect(screen.getByRole('dialog', { name: onboardingFor('bounce')!.title })).toBeTruthy();
    await click("Let's play");expect(screen.getByRole('dialog', { name: 'Paused.' })).toBeTruthy();
    await click('Back to game');await click('Send now');await advance(3600);
    expect(lab().world.won).toBe(true);expect(lab().world.stars.fullScore).toBe(false);
    expect(screen.getByText('Exit reached. Collect every star for full score.')).toBeTruthy();
  });
});
