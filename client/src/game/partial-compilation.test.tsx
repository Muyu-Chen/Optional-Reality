// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { advance, click, ControlledApi, lab, manage, queue, rows, startGame } from '../test/game-harness';

const texts = ['Please make the world pull down gently.', 'Please paint the ball red.', 'Please make every surface extra bouncy.'];
const gravity = { operations: [{ type: 'set_gravity', acceleration: 1 }] };
const bounce = { operations: [{ type: 'set_property', target: 'world', property: 'restitution', value: .9 }] };
const failure = { operations: [], error: 'The ball color cannot be changed.' };
const send = (index: number) => within(rows()[index]).getByRole<HTMLButtonElement>('button', { name: 'Send now' });
async function startBatch() {
  const { api } = await startGame('gravity-lab', new ControlledApi(), texts);
  expect(api.pending).toHaveLength(1); expect(api.pending[0].request.messages.map(message => message.text)).toEqual(texts);
  return api;
}
async function respond(api: ControlledApi, index: number, outcomes: Record<string, unknown>[]) {
  const { rules: _rules, messages, ...identity } = api.pending[index].request;
  await api.respond(index, Response.json({ ...identity, messages: messages.map(({ id }, i) => ({ id, ...outcomes[i] })) }));
}

describe('independent AI message results in the real game queue', () => {
  it('shows Ready/error/Ready, allows sending past the error and never executes preparation', async () => {
    const api = await startBatch(), before = structuredClone(lab().world.rules);
    await respond(api, 0, [gravity, failure, bounce]);
    expect(rows().map(row => row.textContent?.includes('Needs editing'))).toEqual([false, true, false]);
    expect([send(0).disabled, send(1).disabled, send(2).disabled]).toEqual([false, true, false]);
    expect(lab().world.rules).toEqual(before); expect(lab().world.commandCount).toBe(0);
    expect(screen.queryByText('RULE CHANGED')).toBeNull();
    await act(async () => fireEvent.click(send(2)));
    expect(lab().world.rules.values.world.restitution).toBe(.9);
    expect(lab().world.gravity).toBe(0); expect(lab().world.commandCount).toBe(1);
    await act(async () => fireEvent.click(send(0))); await advance(30);
    expect(lab().world.gravity).toBe(1); expect(lab().world.running).toBe(true);
    expect(lab().world.commandCount).toBe(2); expect(api.pending).toHaveLength(1);
    expect(rows()).toHaveLength(1); expect(rows()[0].textContent).toContain('Needs editing');
  });

  it('selects and sends only successful messages from a mixed result', async () => {
    const api = await startBatch(); await respond(api, 0, [gravity, failure, bounce]);
    await manage(); await click('Select ready'); await click('Send all selected');
    expect(lab().world.commandCount).toBe(2); expect(lab().world.gravity).toBe(1);
    expect(lab().world.rules.values.world.restitution).toBe(.9);
    expect(rows()).toHaveLength(1); expect(rows()[0].textContent).toContain(texts[1]);
  });

  it('rechecks permissions per row even when the server claims all results succeeded', async () => {
    const api = await startBatch();
    await respond(api, 0, [gravity, { operations: [
      { type: 'set_gravity', acceleration: 50 }, { type: 'set_property', target: 'ball-A', property: 'friction', value: 0 },
    ] }, { operations: [{ type: 'reverse_gravity' }] }]);
    expect([send(0).disabled, send(1).disabled, send(2).disabled]).toEqual([false, true, false]);
    await act(async () => fireEvent.click(send(0))); await act(async () => fireEvent.click(send(1)));
    expect(lab().world.gravity).toBe(-1); expect(lab().world.commandCount).toBe(2);
    expect(rows()[0].textContent).toContain('Needs editing');
  });

  it('edits just the failed row and preserves other prepared messages without recompiling them', async () => {
    const api = await startBatch(); await respond(api, 0, [gravity, failure, bounce]);
    await click('Edit message 2');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Please give the world an upward pull instead.' } });
    await click('Save ↳');
    expect(api.pending).toHaveLength(2); expect(api.pending[1].request.messages).toHaveLength(1);
    expect(send(0).disabled).toBe(false); expect(send(2).disabled).toBe(false);
    await respond(api, 1, [{ operations: [{ type: 'set_gravity', acceleration: -2 }] }]);
    expect(rows().every(row => !row.textContent?.includes('Needs editing'))).toBe(true);
    await act(async () => fireEvent.click(send(1))); expect(lab().world.gravity).toBe(-2);
  });

  it('retries valid prepared operations while leaving the failed row non-executable', async () => {
    const api = await startBatch(); await respond(api, 0, [gravity, failure, bounce]);
    await act(async () => fireEvent.click(send(0))); await click('Try again');
    expect(api.pending).toHaveLength(1); expect(lab().world.commandCount).toBe(0); expect(lab().world.tick).toBe(0);
    expect([send(0).disabled, send(1).disabled, send(2).disabled]).toEqual([false, true, false]);
    await act(async () => fireEvent.click(send(2))); expect(lab().world.rules.values.world.restitution).toBe(.9);
  });

  it('handles all-error batches without a retry loop or success feedback', async () => {
    const api = await startBatch(); await respond(api, 0, texts.map((_, i) => ({ operations: [], error: `Unsupported message ${i + 1}.` })));
    expect(rows().every(row => row.textContent?.includes('Needs editing'))).toBe(true);
    rows().forEach((row, i) => expect(row.textContent).toContain(`Unsupported message ${i + 1}.`));
    expect([send(0).disabled, send(1).disabled, send(2).disabled]).toEqual([true, true, true]);
    expect(lab().world.started).toBe(false); expect(lab().world.commandCount).toBe(0);
    await act(async () => {}); expect(api.pending).toHaveLength(1);
    expect(screen.queryByText('RULE CHANGED')).toBeNull();
  });

  it('keeps an already ready local rule when a whole network request fails', async () => {
    const { api } = await startGame('gravity-lab', new ControlledApi(), ['add gravity', ...texts]);
    expect(api.pending[0].request.messages).toHaveLength(3);
    await api.respond(0, Response.json({ error: 'Model service unavailable.' }, { status: 503 }));
    expect(send(0).disabled).toBe(false);
    for (let i = 1; i < 4; i++) {
      expect(send(i).disabled).toBe(true); expect(rows()[i].textContent).toContain('Model service unavailable.');
    }
    await act(async () => fireEvent.click(send(0)));
    expect(lab().world.gravity).toBe(1); expect(lab().world.running).toBe(true); expect(api.pending).toHaveLength(1);
  });

  it('does not execute an error returned for Shift+Enter or send an older ready message instead', async () => {
    const { api } = await startGame(); await queue('add gravity');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: texts[1] } });
    await act(async () => fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true }));
    await respond(api, 0, [failure]);
    expect(send(0).disabled).toBe(false); expect(send(1).disabled).toBe(true);
    expect(lab().world.started).toBe(false); expect(lab().world.commandCount).toBe(0);
    expect(screen.queryByText('RULE CHANGED')).toBeNull();
  });

  it.each(['edit', 'delete', 'retry'] as const)('ignores every row of a mixed late response after %s', async action => {
    const api = await startBatch();
    if (action === 'retry') await click('Try again');
    else if (action === 'delete') await click('Delete message 2');
    else {
      await manage(); await click('Edit message 2');
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'stop gravity' } }); await click('Save ↳');
    }
    expect(api.pending[0].signal.aborted).toBe(true); expect(api.pending).toHaveLength(2);
    await respond(api, 0, [gravity, failure, bounce]);
    expect(screen.queryByText(failure.error)).toBeNull();
    expect(rows()[0].textContent).toContain('Interpreting'); expect(lab().world.commandCount).toBe(0);
    await respond(api, 1, api.pending[1].request.messages.map(() => gravity));
    expect(rows().every(row => !row.textContent?.includes('Interpreting'))).toBe(true);
    expect(lab().world.started).toBe(false);
  });
});
