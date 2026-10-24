// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { levels } from '../levels/catalog';
import { advance, click, lab, queue, rows, startGame } from '../test/game-harness';

describe('model fallback for shared physics (controlled API)', () => {
  it.each(levels)('queues an unfamiliar phrase via AI in $id without applying it early', async level => {
    const { api } = await startGame(level.id);
    // Deliberately outside the local correction list; the model handles long-tail language.
    const text = 'Could you make the enviroment accelrate to the right at 1 m/s²?';
    await queue(text);
    expect(api.pending).toHaveLength(1);
    const request = api.pending[0].request;
    expect(request.messages).toEqual([{ id: request.messages[0].id, text }]);
    await advance(120);
    expect(lab().world.tick).toBe(0);
    expect(lab().world.engine.gravity.x).toBe(0);
    await api.respond(0, Response.json({ requestId: request.requestId, levelId: request.levelId,
      sceneVersion: request.sceneVersion, queueRevision: request.queueRevision,
      messages: [{ id: request.messages[0].id,
        operations: [{ type: 'set_property', target: 'world', property: 'acceleration_x', value: 1 }],
        understoodAs: 'Set horizontal acceleration to the right at 1 m/s².' }],
    }));
    expect(rows()[0].textContent).toContain(text);
    expect(rows()[0].textContent).toContain('Understood as: Set horizontal acceleration');
    expect(lab().world.engine.gravity.x).toBe(0);
    await click('Send now');
    expect(lab().world.engine.gravity.x).toBe(1);
    expect(lab().world.commandCount).toBe(1);
    await click('Try again');
    expect(lab().world.engine.gravity.x).toBe(0);
    await click('Send now');
    expect(lab().world.engine.gravity.x).toBe(1);
    expect(api.pending).toHaveLength(1);
  });
});
