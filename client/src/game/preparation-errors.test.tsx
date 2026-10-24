// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { button, click, ControlledApi, lab, queue, rows, startGame } from '../test/game-harness';

describe('preparation failures leave the world unchanged', () => {
  it.each([
    ['unavailable server', () => Response.json({ error: 'Service unavailable' }, { status: 503 })],
    ['non-JSON response', () => new Response('Proxy is offline', { status: 502 })],
    ['invalid output schema', () => Response.json({ messages: [] })],
  ] as const)('handles %s without consuming or repeatedly retrying the message', async (_name, response) => {
    const { api } = await startGame();
    const before = structuredClone(lab().world.rules);
    await queue('Please make this world pull downward gently.');
    await api.respond(0, response());
    expect(rows()[0].textContent).toContain('Needs editing');
    expect(button('Send now').disabled).toBe(true);
    expect(lab().world.rules).toEqual(before);
    expect(lab().world.commandCount).toBe(0);
    await act(async () => {});
    expect(api.pending).toHaveLength(1);
    expect(screen.queryByText('RULE CHANGED')).toBeNull();
  });

  it('rejects an otherwise valid operation that modifies a protected target', async () => {
    const { api } = await startGame();
    await queue('Please make this world pull downward gently.');
    await api.complete(0, [{ type: 'set_property', target: 'ball-A', property: 'friction', value: 0 }]);
    expect(button('Send now').disabled).toBe(true);
    expect(lab().world.commandCount).toBe(0);
    expect(lab().world.gravity).toBe(0);
    expect(screen.queryByText('RULE CHANGED')).toBeNull();
  });

  it('recovers from a network error after the user edits and resubmits', async () => {
    const { api } = await startGame();
    await queue('Please make this world pull downward gently.');
    await act(async () => api.pending[0].reject(new TypeError('Network offline')));
    await click('Edit message 1');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Please enable a gentle downward pull.' } });
    await click('Save ↳');
    await api.complete(1, [{ type: 'set_gravity', acceleration: 1 }]);
    await click('Send now');
    expect(lab().world.gravity).toBe(1);
    expect(lab().world.commandCount).toBe(1);
  });

  it('keeps local commands playable when no API key is configured', async () => {
    const api = new ControlledApi();
    api.configured = false;
    await startGame('gravity-lab', api);
    await queue('Please enable a gentle downward pull.');
    expect(button('Send now').disabled).toBe(true);
    expect(api.pending).toHaveLength(0);
    await click('Delete message 1');
    await queue('add gravity');
    await click('Send now');
    expect(lab().world.gravity).toBe(1);
  });

  it('keeps queueing and sending when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    await startGame();
    await queue('add gravity');
    expect(screen.getByText('Storage is unavailable. Keep this tab open.')).toBeTruthy();
    await click('Send now');
    expect(lab().world.gravity).toBe(1);
  });

  it('reprepares free-form messages after a full restart instead of leaving them stuck', async () => {
    const { api } = await startGame();
    await queue('Please enable a gentle downward pull.');
    await api.complete(0, [{ type: 'set_gravity', acceleration: 1 }]);
    await click('Pause menu');
    await click('Restart & reprepare messages');
    expect(api.pending).toHaveLength(2);
    expect(button('Send now').disabled).toBe(true);
    expect(lab().world.started).toBe(false);
    expect(lab().world.gravity).toBe(0);
  });
});
