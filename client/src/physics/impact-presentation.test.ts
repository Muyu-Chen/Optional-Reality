import { describe, expect, it, vi } from 'vitest';
import { actorImpactPose } from './actor-impact-pose';
import { drawImpacts } from './impact-renderer';
import { ImpactState, type ImpactPulse } from './impact-state';
import { drawActorAt } from './actor-renderer';
import { bounce } from '../levels/bounce';
import { frictionRunway } from '../levels/friction-runway';

const contact = { x: 100, y: 420, normal: { x: 0, y: -1 }, speed: 3, surface: 'floor', colour: '#2374c7' };
const pulse: ImpactPulse = { ...contact, kind: 'impact', born: 0, duration: .32, strength: .8 };
function context() {
  const gradient = { addColorStop: vi.fn() };
  return { save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    beginPath: vi.fn(), ellipse: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(), fillRect: vi.fn(), roundRect: vi.fn(),
    createRadialGradient: vi.fn(() => gradient) };
}

describe('bounded contact presentation', () => {
  it('throttles seams on the same surface, bounds the pulse count, and clears on reduced motion', () => {
    const state = new ImpactState();
    state.record(contact, 0); state.record(contact, .02); state.record(contact, .1);
    expect(state.active).toHaveLength(1);
    state.record(contact, .13); expect(state.active).toHaveLength(2);
    for (let i = 0; i < 20; i++) state.record({ ...contact, surface: `wall-${i}` }, .3 + i * .05);
    expect(state.active.length).toBeLessThanOrEqual(8);
    state.advance(2, true); expect(state.active).toHaveLength(0);
    state.record(contact, 2.1); state.advance(2.2, false);
    expect(state.active).toHaveLength(0);
    state.record(contact, 2.3); expect(state.active).toHaveLength(1);
    state.advance(3); expect(state.active).toHaveLength(0);
  });

  it('keeps deformation small, oriented to the collision normal and equal in area', () => {
    const pose = actorImpactPose([pulse], .06)!;
    expect(pose.angle).toBeCloseTo(-Math.PI / 2);
    expect(pose.normalScale).toBeGreaterThanOrEqual(.92);
    expect(pose.normalScale).toBeLessThan(1);
    expect(pose.normalScale * pose.tangentScale).toBeCloseTo(1, 12);
    expect(actorImpactPose([pulse], .06, true)).toBeUndefined();
    expect(actorImpactPose([pulse], .23)).toBeUndefined();
    expect(actorImpactPose([{ ...pulse, normal: { x: -1, y: 0 } }], .06)?.angle).toBeCloseTo(Math.PI);
  });

  it('rotates ripples into the real surface tangent instead of drawing every impact horizontally', () => {
    const ctx = context();
    drawImpacts(ctx as unknown as CanvasRenderingContext2D, [{ ...pulse, normal: { x: -1, y: 0 } }], .06);
    expect(ctx.translate).toHaveBeenCalledWith(100, 420);
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI * 1.5);
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalledTimes(2);
  });

  it('applies a drawing transform to a ball but keeps a sliding box rectangular and unscaled', () => {
    const pose = actorImpactPose([pulse], .06)!, ball = context(), box = context();
    drawActorAt(ball as unknown as CanvasRenderingContext2D, bounce, { x: 10, y: 20 }, .3, pose);
    expect(ball.scale).toHaveBeenCalledWith(pose.normalScale, pose.tangentScale);
    drawActorAt(box as unknown as CanvasRenderingContext2D, frictionRunway, { x: 10, y: 20 }, 0, pose);
    expect(box.scale).not.toHaveBeenCalled();
    expect(box.roundRect).toHaveBeenCalled();
    expect(box.arc).not.toHaveBeenCalled();
  });
});
