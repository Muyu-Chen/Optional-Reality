import type { Point } from '../../levels/types';
import { sceneColours } from '../drawing-theme';
export type Ctx = CanvasRenderingContext2D;

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export function strokePath(ctx: Ctx, points: readonly Point[], color = '#b9a58a', width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

export function oval(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function bakeryText(ctx: Ctx, text: string, x: number, y: number, size = 14, color: string = sceneColours.bakeryInk, weight = '500') {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function tag(ctx: Ctx, label: string, x: number, y: number, width = 110) {
  roundRect(ctx, x, y, width, 23, 4, '#fff7df');
  bakeryText(ctx, label, x + 7, y + 16, 12, sceneColours.bakeryInk, '600');
}
