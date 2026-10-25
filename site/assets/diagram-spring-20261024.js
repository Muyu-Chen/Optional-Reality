import { springFrame, springModel, springPeakCompression } from './diagram-timeline-20261024.js';
import { arrow, ball, base, line, palette, roundedRect, star, text } from './diagram-paint-20261024.js';

const copy = {
  suspended: ['INITIAL STATE', 'Suspended.', 'No gravity. No support.'],
  falling: ['RULE SENT', 'add gravity', 'The ball falls toward the star.'],
  compressing: ['PASSIVE SPRING', 'Compressing.', 'The ball slows; the spring pushes back.'],
  extending: ['PASSIVE SPRING', 'Rebounding.', 'The spring extends and speeds it up.'],
  bouncing: ['FREE FLIGHT', 'Up, then down.', 'Only gravity acts after the ball leaves.'],
  prepareReverse: ['NEXT MESSAGE READY', 'reverse the gravity', 'Send while the ball is falling.'],
  slowing: ['RULE SENT', 'reverse the gravity', 'First slow down. Then turn around.'],
  rising: ['NEW DIRECTION', 'reverse the gravity', 'The same ball. A different rule.'],
  complete: ['A NEW OUTCOME', 'Up it goes.', 'Change the rule, not the ball.'],
};

export function drawSpring(ctx, elapsed) {
  const state = springFrame(elapsed);
  base(ctx, '02', 'REWRITE THE FALL');
  line(ctx, [[292, 74], [292, 308]], palette.line, 1);
  text(ctx, 'CHANGE THE RULE. CHOOSE THE MOMENT.', 24, 338, 11, palette.muted);
  ctx.save(); ctx.globalAlpha = state.opacity;

  // The floor-mounted spring follows the simulated compression, including its cap.
  const x = 155, floor = 304, top = state.capY;
  ctx.fillStyle = '#203e310d'; ctx.beginPath(); ctx.ellipse(x, floor + 5, 45, 7, 0, 0, Math.PI * 2); ctx.fill();
  line(ctx, [[110, floor + 2], [200, floor + 2]], palette.ink, 4);
  for (let i = 112; i < 198; i += 10) line(ctx, [[i, floor + 9], [i + 8, floor + 3]], '#a5ad96', 1);
  const points = [[x, floor], [x, floor - 7]];
  for (let i = 0; i < 13; i++) points.push([x + (i % 2 ? 14 : -14), floor - 7 - (floor - top - 14) * i / 12]);
  points.push([x, top + 7], [x, top]);
  line(ctx, points.map(([px, py]) => [px + 1.5, py + 1.5]), '#185f7f', 4);
  line(ctx, points, palette.blue, 3);
  roundedRect(ctx, x - 25, top - 2, 50, 6, 3, palette.ink);
  // This is elastic energy, not a countdown: it fills during compression and
  // empties again while the extending spring accelerates the ball upward.
  const stored = Math.min(1, state.springEnergy / (.5 * springModel.stiffness * springPeakCompression ** 2));
  text(ctx, 'ENERGY', 50, 284, 8, palette.muted, 600);
  roundedRect(ctx, 50, 291, 61, 3, 2, '#d7cbb4');
  if (stored > 0) roundedRect(ctx, 50, 291, 61 * stored, 3, 2, palette.blue);

  ctx.save(); ctx.beginPath(); ctx.rect(42, 70, 226, 237); ctx.clip();
  if (!state.collected) {
    ctx.save(); ctx.translate(x, 174); ctx.rotate(Math.sin(elapsed * 2) * .05); star(ctx, 0, 0, 13); ctx.restore();
  } else if (state.collectionAge < .55) {
    const progress = state.collectionAge / .55;
    ctx.save(); ctx.globalAlpha *= 1 - progress;
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      star(ctx, x + Math.cos(angle) * (15 + progress * 25), 174 + Math.sin(angle) * (15 + progress * 25), 2.4);
    }
    ctx.restore();
  }
  // A short recent-motion trail makes acceleration legible without a dotted GIF smear.
  if (Math.abs(state.velocity) > 15) for (let i = 4; i > 0; i--) {
    const earlier = springFrame(Math.max(0, state.time - i * .045));
    ctx.save(); ctx.globalAlpha *= (5 - i) * .035;
    ball(ctx, x, earlier.y, 17); ctx.restore();
  }
  ball(ctx, x, state.y, 17);
  if (state.springForce > 0) {
    const length = Math.min(47, Math.max(8, state.springForce / 28));
    arrow(ctx, [106, state.y + 6], [106, state.y - length], palette.blue, 2);
  }
  if (state.gravity === 0) {
    line(ctx, [[116, 100], [125, 100]], palette.muted, 1);
    line(ctx, [[185, 100], [194, 100]], palette.muted, 1);
  } else if (state.gravity > 0) arrow(ctx, [230, 128], [230, 197], palette.violet, 2.5);
  else arrow(ctx, [230, 197], [230, 128], palette.violet, 2.5);
  ctx.restore();

  const [label, command, detail] = copy[state.phase];
  text(ctx, label, 315, 97, 10, palette.muted, 650);
  // Commands are readable, but passive spring motion never appears as a player command.
  text(ctx, command, 315, 133, command.length > 16 ? 21 : 25, palette.ink, 650);
  text(ctx, detail, 315, 166, 11, palette.muted);
  const acceleration = state.gravity === 0 ? 'a = 0' : `a ${state.gravity > 0 ? '↓' : '↑'} 9.8 m/s²`;
  text(ctx, acceleration, 315, 211, 20, palette.violet, 600);
  if (['falling', 'slowing', 'rising'].includes(state.phase)) {
    roundedRect(ctx, 315, 229, 54, 20, 6, '#e3ebd8');
    text(ctx, 'SENT', 325, 243, 10, palette.ink, 650);
  } else if (state.phase === 'prepareReverse') {
    roundedRect(ctx, 315, 229, 82, 20, 6, palette.ink);
    text(ctx, 'Send now ↗', 324, 243, 10, '#fff8e7', 650);
  }
  line(ctx, [[315, 268], [611, 268]], palette.line, 1);
  star(ctx, 327, 292, 9, state.collected ? 1 : .55);
  text(ctx, state.collected ? 'STAR COLLECTED' : 'A STAR, BELOW YOU', 348, 297, 11, state.collected ? palette.ink : palette.muted, 600);
  ctx.restore();
}
