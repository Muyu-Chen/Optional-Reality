import { describe, expect, it, vi } from 'vitest';
import { drawSurface } from './surface-renderer';
import { catchCup } from '../levels/catch-cup';
import { initialRules, ruleContext } from '../levels/rules';
import { applyRules } from '../../../shared/rules';

describe('surface labels show effective material', () => {
  it.each([0, 1, 1.5])('shows the actual launch-pad value %s after a general command', value => {
    const fillText = vi.fn();
    const ctx = new Proxy({ fillText }, { get: (object, key) => key in object ? object[key as 'fillText'] : vi.fn() }) as unknown as CanvasRenderingContext2D;
    const rules = applyRules(initialRules(catchCup), [{ type: 'set_property', target: 'world', property: 'restitution', value }], ruleContext(catchCup));
    drawSurface(ctx, catchCup.tracks[0], rules);
    expect(fillText.mock.calls[0][0]).toBe(`Launch pad · ${value}`);
  });
});
