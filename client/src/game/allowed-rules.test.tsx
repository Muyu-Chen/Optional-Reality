// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { levels } from '../levels/catalog';
import { editableRuleLabels } from '../levels/presentation';
import { onboardingFor } from '../levels/onboarding';
import { ControlledApi, lab, startGame } from '../test/game-harness';

describe('visible editing limits in each level', () => {
  it.each(levels)('reveals the real permitted controls in the $id composer without changing the world', async level => {
    const { api } = await startGame(level.id);
    const composer = screen.getByRole('region', { name: 'Write a rule' });
    const expand = within(composer).getByRole('button', { name: 'Expand allowed rules' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(expand);
    const panel = within(composer).getByRole('region', { name: 'Allowed rules' });
    expect(within(panel).getAllByRole('listitem').map(item => item.textContent)).toEqual(editableRuleLabels(level));
    expect(lab().world.tick).toBe(0);expect(lab().world.commandCount).toBe(0);expect(api.pending).toHaveLength(0);
  });

  it.each(levels.filter(level => onboardingFor(level.id)))('explains the same editing limits and fixed objects in the $id tutorial', async level => {
    await startGame(level.id, new ControlledApi(), [], true);
    const tutorial = screen.getByRole('dialog', { name: onboardingFor(level.id)!.title });
    expect(within(tutorial).getByText(level.presentation === 'bakery'
      ? 'Only these rules can be changed in this level. The bread, pickup bag and layout stay fixed.'
      : 'Only these rules can be changed in this level. The ball, exit and layout stay fixed.')).toBeTruthy();
    fireEvent.click(within(tutorial).getByRole('button', { name: 'Expand allowed rules' }));
    const panel = within(tutorial).getByRole('region', { name: 'Allowed rules' });
    expect(within(panel).getAllByRole('listitem').map(item => item.textContent)).toEqual(editableRuleLabels(level));
    expect(within(panel).queryByText('Spring strength', { exact: true })).toBeNull();
    expect(lab().world.started).toBe(false);expect(lab().world.commandCount).toBe(0);
  });
});
