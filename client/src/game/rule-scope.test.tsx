// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { click, lab, queue, rows, startGame } from '../test/game-harness';

describe('intuitive message scope in Catch Tutorial', () => {
  it('keeps default and local edits visibly different before and after sending', async () => {
    await startGame('catch-cup');
    await queue('Set surface bounce to 1.5');
    await queue('Set launch pad bounce to 1');
    await queue('Set cup bounce to 0');
    expect(rows()).toHaveLength(3);
    expect(rows()[0].querySelector('.rule-preview-label')?.textContent).toBe('All surfaces · restitution = 1.5');
    expect(rows()[1].querySelector('.rule-preview-label')?.textContent).toBe('Launch pad · restitution = 1');
    expect(rows()[2].querySelector('.rule-preview-label')?.textContent).toBe('Cup base · restitution = 0');
    await click('Send now');
    expect(lab().world.rules.values.world.restitution).toBe(1.5);
    expect(lab().world.rules.values['launch-pad'].restitution).toBe(1.5);
    await click('Send now');
    expect(lab().world.rules.values['launch-pad'].restitution).toBe(1);
    expect(lab().world.rules.values['cup-base'].restitution).toBe(1.5);
    await click('Send now');
    expect(lab().world.rules.values['cup-base'].restitution).toBe(0);
  });
  it('restores independent initial materials on retry and reapplies the same general message', async () => {
    await startGame('catch-cup');
    await queue('Set surface bounce to 1.5');
    await click('Send now'); await click('Try again');
    expect(lab().world.rules.values['launch-pad'].restitution).toBe(.1);
    expect(lab().world.rules.values['cup-base'].restitution).toBe(1.05);
    await click('Send now');
    expect(lab().world.rules.values['launch-pad'].restitution).toBe(1.5);
    expect(lab().world.rules.values['cup-base'].restitution).toBe(1.5);
    await click('Manage'); await click('Undo last rule');
    expect(lab().world.rules.values['launch-pad'].restitution).toBe(.1);
    expect(lab().world.rules.values['cup-base'].restitution).toBe(1.05);
  });
});
