// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { onboardingFor, onboardingStorageKey } from '../levels/onboarding';
import { findLevel } from '../levels/catalog';
import { advance, click, ControlledApi, lab, manage, queue, rows, startGame } from '../test/game-harness';

const ids = ['toaster', 'breeze', 'reality-breakdown'] as const;

describe('bakery chapter illustrated guides', () => {
  it.each(ids)('pauses at the first %s toaster contact even when its power starts off', async id => {
    await startGame(id, new ControlledApi(), [], true);
    await click("Let's play");
    expect(screen.queryByRole('dialog')).toBeNull();
    if (id === 'reality-breakdown') {
      await queue('Set conveyor speed to 1.5');await click('Send now');
    } else await click('Start game');
    await advance(30);
    expect(lab().world.tutorialId).toBeNull();
    await advance(600);
    const teaching = screen.getByRole('dialog', { name: 'A little stored energy.' });
    expect(teaching.querySelector('.bakery-lesson-diagram')).toBeTruthy();
    expect(lab().world.devices.springs.get('spring-main')!.phase).toBe(id === 'breeze' ? 'charging' : 'idle');
    expect(lab().world.devices.firedSprings.size).toBe(0);
    const tick = lab().world.tick, position = {...lab().world.ball.position};
    await advance(600);
    expect(lab().world.tick).toBe(tick);expect(lab().world.ball.position).toEqual(position);
    if (id !== 'breeze') {
      expect(teaching.textContent).toContain('If the toaster is off');
      await queue('Set toaster power to 2');await click('Send now');
      await advance(120);
      expect(lab().world.tick).toBe(tick);expect(lab().world.running).toBe(false);
    } else expect(teaching.textContent).toContain('preset to power 2');
    await click('Continue →');await advance(84);
    expect(lab().world.devices.firedSprings.has('spring-main')).toBe(true);
    expect(lab().world.tutorialId).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each(ids)('explains the actual %s setup and preserves drafts while time is paused', async id => {
    const drafts = ['Set surface friction to 0'];
    const { api } = await startGame(id, new ControlledApi(), drafts, true);
    const lesson = onboardingFor(id)!;
    const dialog = screen.getByRole('dialog', { name: lesson.title });
    expect(dialog.querySelectorAll('.bakery-lesson-diagram')).toHaveLength(3);
    expect(within(dialog).getByRole('region', { name: 'Machine setup' })).toBeTruthy();
    expect(dialog.querySelectorAll('.onboarding-machines .is-preset')).toHaveLength(id === 'reality-breakdown' ? 0 : 2);
    expect(Array.from(dialog.querySelectorAll('.onboarding-commands code')).map(node => node.textContent))
      .toEqual([...findLevel(id)!.instructions.exampleMessages]);
    const markers = Array.from(dialog.querySelectorAll('marker[id]')).map(node => node.id);
    expect(new Set(markers).size).toBe(markers.length);
    expect(localStorage.getItem(onboardingStorageKey(id))).toBe('seen');
    await advance(3600);
    expect(lab().world.tick).toBe(0);expect(lab().world.commandCount).toBe(0);
    expect(rows()).toHaveLength(1);expect(rows()[0].textContent).toContain(drafts[0]);
    expect(api.pending).toHaveLength(0);
    await click("Let's play");
    expect(rows()).toHaveLength(1);expect(rows()[0].textContent).toContain(drafts[0]);
    expect(lab().world.started).toBe(false);
    await click('Try again');expect(screen.queryByRole('dialog')).toBeNull();
    await click('Pause menu');await click('How to play');
    expect(screen.getByRole('dialog', { name: lesson.title })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'Paused.' })).toBeTruthy();
  });

  it.each(ids)('loads and plays the %s guide setup to full score without requesting AI', async id => {
    const { api } = await startGame(id, new ControlledApi(), [], true);
    await click(onboardingFor(id)!.starterLabel!);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(rows()).toHaveLength(findLevel(id)!.instructions.exampleMessages.length);
    expect(rows().every(row => row.textContent?.includes('Ready'))).toBe(true);
    expect(lab().world.started).toBe(false);
    await manage();await click('Select ready');await click('Send all selected');
    await advance(3600);
    expect(lab().world.tutorialId).toBe('toaster-charge');
    const teaching = screen.getByRole('dialog', { name: 'A little stored energy.' });
    expect(teaching.querySelector('.bakery-lesson-diagram')).toBeTruthy();
    expect(teaching.textContent).toContain('0.6-second charge');
    const tick = lab().world.tick;
    await advance(3600);expect(lab().world.tick).toBe(tick);
    await click('Continue →');await advance(3600);
    expect(lab().world.won).toBe(true);expect(lab().world.stars.fullScore).toBe(true);
    if (id === 'reality-breakdown') {
      expect(lab().world.rules.triggers).toEqual([{ sensor: 'sensor-gate', gate: 'gate-final' }]);
      expect(lab().world.devices.openGates.has('gate-final')).toBe(true);
    }
    expect(api.pending).toHaveLength(0);
  });
});
