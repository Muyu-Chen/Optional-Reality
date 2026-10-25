// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { click, lab, queue, rows, startGame } from '../test/game-harness';

describe('AST local preparation in the game', () => {
  it('prepares multiple targets without an API request, applies once, and reuses them after retry', async () => {
    const { api } = await startGame('catch-cup');
    await queue('设置发射板和杯底的弹性为0.5，并关闭重力');
    expect(api.pending).toHaveLength(0);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Ready');
    expect(lab().world.started).toBe(false);
    expect(lab().world.rules.values['cup-base'].restitution).toBe(1.05);
    await click('Send now');
    expect(lab().world.rules.values['launch-pad'].restitution).toBe(.5);
    expect(lab().world.rules.values['cup-base'].restitution).toBe(.5);
    expect(lab().world.rules.acceleration.y).toBe(0);
    expect(lab().world.commandCount).toBe(1);
    await click('Try again');
    expect(lab().world.rules.values['cup-base'].restitution).toBe(1.05);
    expect(rows()[0].textContent).toContain('Ready');
    await click('Send now');
    expect(lab().world.rules.values['cup-base'].restitution).toBe(.5);
    expect(api.pending).toHaveLength(0);
  });
  it('Shift+Enter applies the entire local program once and leaves older messages queued', async () => {
    const { api } = await startGame();
    await queue('gravity=9');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'gravity=2 and double gravity' } });
    await act(async () => fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true }));
    expect(lab().world.rules.acceleration.y).toBe(4);
    expect(lab().world.commandCount).toBe(1);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('gravity=9');
    expect(api.pending).toHaveLength(0);
  });
  it.each(['stop gravity and teleport the ball', '向上的浮力'])('sends the complete unparsed message to AI without applying its local prefix: %s', async text => {
    const { api } = await startGame();
    await queue(text);
    expect(api.pending).toHaveLength(1);
    expect(api.pending[0].request.messages.map(message => message.text)).toEqual([text]);
    expect(lab().world.commandCount).toBe(0);
    expect(lab().world.started).toBe(false);
    if (text === '向上的浮力') {
      await api.complete(0, [{ type: 'set_property', target: 'world', property: 'acceleration_y', value: -1 }]);
      expect(lab().world.commandCount).toBe(0);
      await click('Send now');
      expect(lab().world.rules.acceleration.y).toBe(-1);
    } else {
      const request = api.pending[0].request;
      await api.respond(0, Response.json({ ...request, rules: undefined, messages: [{ id: request.messages[0].id, operations: [], error: 'Teleport is unsupported.' }] }));
      expect(lab().world.commandCount).toBe(0);
      expect(rows()[0].textContent).toContain('Needs editing');
    }
  });
});
