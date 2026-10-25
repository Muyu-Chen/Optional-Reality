import { orbitFrame } from './diagram-timeline-20261024.js';
import { arrow, ball, base, line, palette, roundedRect, text } from './diagram-paint-20261024.js';

export function drawOrbit(ctx, elapsed) {
  const state = orbitFrame(elapsed);
  base(ctx, '03', 'CUSTOM GRAVITY FIELD');
  const { x, y, sourceX, sourceY } = state;
  ctx.save();
  ctx.beginPath(); ctx.rect(22, 60, 596, 253); ctx.clip();
  // Soft field rings stay behind the orbit and the two objects.
  const glow = ctx.createRadialGradient(sourceX, sourceY, 25, sourceX, sourceY, 178);
  glow.addColorStop(0, '#d7e6c88a'); glow.addColorStop(1, '#d7e6c800');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sourceX, sourceY, 178, 0, Math.PI * 2); ctx.fill();
  for (const r of [55, 90, 125]) {
    ctx.strokeStyle = '#d1d7be'; ctx.lineWidth = 1; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.arc(sourceX, sourceY, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([3, 6]); ctx.strokeStyle = '#a4b29b'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(352, 193, 160, 160 * Math.sqrt(1 - .65 ** 2), 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  // A continuously sampled tail is curved and fades into the path; it never steps between frames.
  for (let i = 24; i > 0; i--) {
    const previous = orbitFrame(elapsed - i * .045);
    const next = orbitFrame(elapsed - (i - 1) * .045);
    ctx.globalAlpha = (1 - i / 25) * .5;
    line(ctx, [[previous.x, previous.y], [next.x, next.y]], palette.blue, 3);
  }
  ctx.globalAlpha = 1;
  const dx = sourceX - x, dy = sourceY - y, distance = Math.hypot(dx, dy);
  arrow(ctx, [x + dx / distance * 18, y + dy / distance * 18],
    [sourceX - dx / distance * 33, sourceY - dy / distance * 33], palette.blue, 2, Math.min(7, Math.max(3, (distance - 51) / 2)));

  ctx.save(); ctx.shadowColor = '#203e3130'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 7;
  const source = ctx.createRadialGradient(sourceX - 13, sourceY - 14, 2, sourceX, sourceY, 35);
  source.addColorStop(0, '#497b5a'); source.addColorStop(.7, palette.ink); source.addColorStop(1, '#112b22');
  ctx.fillStyle = source; ctx.beginPath(); ctx.arc(sourceX, sourceY, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  text(ctx, 'A', sourceX - 7, sourceY + 7, 22, '#fff8e7', 600);
  ball(ctx, x, y, 15);
  text(ctx, 'B', x + 22, y + 5, 17, palette.ink, 650);
  ctx.restore();

  roundedRect(ctx, 24, 71, 155, 44, 9, '#fffaf0dd', '#e0d4bd');
  text(ctx, 'RULE IN THIS SKETCH', 35, 88, 9, palette.muted, 600);
  text(ctx, 'Let A attract B.', 35, 105, 12, palette.ink, 650);
  line(ctx, [[22, 318], [618, 318]], palette.line, 1);
  text(ctx, 'ONE SOURCE. A NEW WAY TO MOVE.', 24, 340, 11, palette.muted);
}
