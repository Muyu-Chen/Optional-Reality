// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { advance, click, ControlledApi, lab, queue, rows, startGame } from '../test/game-harness';

describe('additive rule messages', () => {
  it('shows +2 and applies its clamped sum, while retry and Undo retain the relative message', async () => {
    const { api } = await startGame('bounce');await queue('地面弹力+2');
    expect(rows()[0].textContent).toContain('restitution + 2');
    expect(rows()[0].textContent).not.toContain('×');expect(api.pending).toHaveLength(0);
    await click('Send now');expect(lab().world.rules.values.world.restitution).toBe(1.5);
    expect(screen.getByText('Surface bounce increased to 1.5 (limited from 2.1).')).toBeTruthy();
    await advance(1);await click('Manage');await click('Undo last rule');
    expect(lab().world.rules.values.world.restitution).toBe(.1);
    expect(rows()[0].textContent).toContain('restitution + 2');
    await click('Send now');await click('Try again');
    expect(lab().world.rules.values.world.restitution).toBe(.1);
    expect(rows()[0].textContent).toContain('restitution + 2');
  });
  it('uses current state even when messages are sent in a different order', async () => {
    await startGame('bounce');await queue('bounce +0.2');await queue('Set surface bounce to 0.8');
    await act(() => fireEvent.click(within(rows()[1]).getByRole('button', { name: 'Send now' })));
    await click('Send now');expect(lab().world.rules.values.world.restitution).toBe(1);
  });
  it('rechecks model arithmetic per message before enabling Send now', async () => {
    const { api } = await startGame('bounce', new ControlledApi(), ['padding 弹力+2', 'Please pull downward gently.']);
    const { rules: _rules, messages, ...identity } = api.pending[0].request;
    await api.respond(0, Response.json({ ...identity, messages: [
      { id: messages[0].id, operations: [{ type: 'scale_property', target: 'world', property: 'restitution', factor: 2 }] },
      { id: messages[1].id, operations: [{ type: 'set_gravity', acceleration: 1 }] },
    ] }));
    expect(rows()[0].textContent).toContain('Needs editing');
    expect(within(rows()[0]).getByRole<HTMLButtonElement>('button', { name: 'Send now' }).disabled).toBe(true);
    expect(within(rows()[1]).getByRole<HTMLButtonElement>('button', { name: 'Send now' }).disabled).toBe(false);
    expect(lab().world.commandCount).toBe(0);
  });
});
