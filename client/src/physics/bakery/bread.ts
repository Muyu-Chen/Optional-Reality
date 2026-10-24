import { oval, type Ctx } from './drawing';

export function drawBread(ctx: Ctx, x: number, y: number, r: number, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  oval(ctx, 0, 2, r + 1, r - 1, '#80522b');
  oval(ctx, 0, -1, r, r - 1, '#c88e43');
  oval(ctx, -3, -4, r * .72, r * .54, '#e0b878');
  ctx.strokeStyle = '#fff0c9';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-5 + i * 5, -6);
    ctx.lineTo(-8 + i * 5, 0);
    ctx.stroke();
  }
  ctx.restore();
}
