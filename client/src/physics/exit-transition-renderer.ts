import type { LevelDefinition } from '../levels/types';
import type { ExitVisual } from './exit-transition';
import { drawActorAt } from './actor-renderer';
import { drawBread } from './bakery/bread';
import { sceneColours } from './drawing-theme';

export function drawExitTransition(ctx: CanvasRenderingContext2D, level: LevelDefinition, visual: ExitVisual | null) {
  if (!visual) return;
  const { target, actor, progress, portalScale } = visual;
  const radius = Math.max(26, Math.min(46, Math.min(level.exit.width, level.exit.height) * .5));
  if (portalScale > .001) {
    ctx.save();ctx.translate(target.x, target.y);ctx.scale(portalScale, portalScale);
    const glow = ctx.createRadialGradient(0, 0, radius * .55, 0, 0, radius * 1.55);
    glow.addColorStop(0, '#e9ab2460');glow.addColorStop(.65, '#e9ab2420');glow.addColorStop(1, '#e9ab2400');
    ctx.fillStyle = glow;ctx.beginPath();ctx.arc(0, 0, radius * 1.55, 0, Math.PI * 2);ctx.fill();
    ctx.fillStyle = '#132c25';ctx.beginPath();ctx.arc(0, 0, radius, 0, Math.PI * 2);ctx.fill();
    ctx.strokeStyle = sceneColours.star;ctx.lineWidth = 2.5;ctx.beginPath();ctx.ellipse(0, 0, radius * 1.13, radius * .75, -.32, 0, Math.PI * 2);ctx.stroke();
    ctx.rotate(progress * Math.PI * 1.8);
    for (let arm = 0; arm < 3; arm++) {
      ctx.rotate(Math.PI * 2 / 3);ctx.strokeStyle = arm === 0 ? '#f6df9e' : '#789f79';ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let step = 0; step <= 28; step++) {
        const fraction = step / 28, angle = fraction * Math.PI * 1.3, r = radius * (.18 + fraction * .7);
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
        if (!step) ctx.moveTo(x, y);else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#0d221c';ctx.beginPath();ctx.arc(0, 0, radius * .29, 0, Math.PI * 2);ctx.fill();
    ctx.restore();
  }
  if (actor.scale <= .001 || actor.opacity <= .001) return;
  ctx.save();ctx.translate(actor.x, actor.y);ctx.scale(actor.scale, actor.scale);ctx.globalAlpha *= actor.opacity;
  if (level.presentation === 'bakery') drawBread(ctx, 0, 0, level.ball.radius, actor.angle);
  else drawActorAt(ctx, level, { x: 0, y: 0 }, actor.angle);
  ctx.restore();
}
