import type { Point } from '../levels/types';

// Behaviour keeps its colour across chapters; permission is shown separately.
export const physicsColours = {
  bounce: '#347fb2',
  drive: '#ba692c',
  friction: '#287f82',
  gravity: '#8861a0',
  structure: '#48554b',
  goal: '#4f815b',
} as const;

export function drawForceArrow(ctx: CanvasRenderingContext2D, x: number, y: number, vector: Point, length: number, colour: string) {
  const magnitude = Math.hypot(...vector);
  if (!magnitude) return;
  const dx = vector[0] / magnitude, dy = vector[1] / magnitude;
  const tipX = x + dx * length, tipY = y + dy * length;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(tipX, tipY);
  ctx.moveTo(tipX - dx * 6 - dy * 4, tipY - dy * 6 + dx * 4);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(tipX - dx * 6 + dy * 4, tipY - dy * 6 - dx * 4);
  ctx.stroke();
}

export function drawBounceMarks(ctx: CanvasRenderingContext2D, points: readonly Point[], restitution: number) {
  ctx.save();
  ctx.strokeStyle = physicsColours.bounce;
  ctx.lineWidth = 2;
  const amplitude = 3 + Math.min(1.5, Math.max(0, restitution)) * 12;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1], [endX, endY] = points[i];
    const length = Math.hypot(endX - x, endY - y);
    const dx = (endX - x) / length, dy = (endY - y) / length;
    for (let distance = 20; distance < length - 10; distance += 32) {
      const px = x + dx * distance, py = y + dy * distance;
      ctx.beginPath();
      ctx.moveTo(px - dx * 6 + dy * 10, py - dy * 6 - dx * 10);
      ctx.quadraticCurveTo(px + dy * (10 + amplitude), py - dx * (10 + amplitude), px + dx * 6 + dy * 10, py + dy * 6 - dx * 10);
      ctx.stroke();
    }
  }
  ctx.restore();
}
