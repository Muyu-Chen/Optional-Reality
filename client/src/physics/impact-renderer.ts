import type { ImpactPulse } from './impact-state';

/** A short ripple on the surface plane, expanding only into its outward half-space. */
export function drawImpacts(ctx: CanvasRenderingContext2D, impacts: readonly ImpactPulse[], time: number) {
  if (!impacts.length) return;
  ctx.save();
  for (const impact of impacts) {
    const progress = Math.max(0, Math.min(1, (time - impact.born) / impact.duration));
    if (progress >= 1) continue;
    ctx.save(); ctx.translate(impact.x, impact.y);
    // Local x is the surface tangent; negative local y points along the real normal.
    ctx.rotate(Math.atan2(impact.normal.y, impact.normal.x) + Math.PI / 2);
    ctx.strokeStyle = impact.colour; ctx.lineCap = 'round';
    for (let ring = 0; ring < 2; ring++) {
      const p = progress - ring * .17;
      if (p < 0) continue;
      const width = 4 + p * (15 + impact.strength * 15);
      const height = 1 + p * (2 + impact.strength * 4);
      ctx.globalAlpha = (1 - progress) ** 2 * (.25 + impact.strength * .55) * (ring ? .6 : 1);
      ctx.lineWidth = 1.1 + impact.strength * .8;
      ctx.beginPath(); ctx.ellipse(0, 0, width, height, 0, Math.PI, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
