export const palette = {
  paper: '#fcf5e8', ink: '#203e31', muted: '#657564', line: '#d8ceba',
  blue: '#258eb6', gold: '#d69521', lime: '#d9ec89', violet: '#8c64ad',
};

export function roundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

export function line(ctx, points, color = palette.ink, width = 2) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function text(ctx, label, x, y, size = 13, color = palette.ink, weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillText(label, x, y);
}

export function base(ctx, number, title) {
  ctx.clearRect(0, 0, 640, 360);
  const paper = ctx.createLinearGradient(0, 0, 640, 360);
  paper.addColorStop(0, '#fffaf0'); paper.addColorStop(1, '#f4ead5');
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#d4c7ab';
  for (let x = 22; x < 640; x += 25) for (let y = 74; y < 324; y += 25) {
    ctx.globalAlpha = .38; ctx.beginPath(); ctx.arc(x, y, .8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  roundedRect(ctx, 22, 16, 35, 24, 7, palette.ink);
  text(ctx, number, 30, 33, 13, '#fff8e7', 700);
  text(ctx, title, 70, 33, 12, palette.muted, 600);
  line(ctx, [[22, 52], [618, 52]], palette.line, 1);
}

export function ball(ctx, x, y, radius = 17, color = palette.lime) {
  ctx.save();
  ctx.shadowColor = '#203e3129'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
  const body = ctx.createRadialGradient(x - radius * .4, y - radius * .5, 1, x, y, radius * 1.2);
  body.addColorStop(0, '#f1f8c6'); body.addColorStop(.45, color); body.addColorStop(1, '#9fbd63');
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = palette.ink; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#fffef1'; ctx.globalAlpha *= .8;
  ctx.beginPath(); ctx.ellipse(x - radius * .32, y - radius * .38, radius * .22, radius * .16, -.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function star(ctx, x, y, radius = 12, opacity = 1) {
  ctx.save(); ctx.globalAlpha *= opacity;
  ctx.shadowColor = '#e6ac4060'; ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const length = radius * (i % 2 ? .46 : 1);
    const point = [x + Math.cos(angle) * length, y + Math.sin(angle) * length];
    i ? ctx.lineTo(...point) : ctx.moveTo(...point);
  }
  ctx.closePath();
  const fill = ctx.createLinearGradient(x, y - radius, x, y + radius);
  fill.addColorStop(0, '#ffe9a1'); fill.addColorStop(.55, '#f2c34f'); fill.addColorStop(1, '#d79421');
  ctx.fillStyle = fill; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#b67a16'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

export function arrow(ctx, start, end, color = palette.blue, width = 2, head = 7) {
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  line(ctx, [start, end], color, width);
  line(ctx, [[end[0] - head * Math.cos(angle - .5), end[1] - head * Math.sin(angle - .5)], end,
    [end[0] - head * Math.cos(angle + .5), end[1] - head * Math.sin(angle + .5)]], color, width);
}
