import { BOXES, TRAJECTORY_POINTS, titleFrame } from './scene';

type Sprite = 'ball' | 'star' | 'island' | 'exit' | 'cloud' | 'landscape';
export type TitleSprites = Record<Sprite, CanvasImageSource>;

/** Offline GIF renderer: geometry and timing are shared with the live SVG layers. */
export function renderTitleFrame(ctx: CanvasRenderingContext2D, sprites: TitleSprites, clip: Path2D, seconds: number) {
  const frame = titleFrame(seconds);
  const image = (name: Sprite, box: { x: number; y: number; width: number; height: number }) => ctx.drawImage(sprites[name], box.x, box.y, box.width, box.height);
  ctx.clearRect(0, 0, 800, 680);
  ctx.fillStyle = '#dcedf5'; ctx.fillRect(0, 0, 800, 680);
  ctx.save(); ctx.clip(clip); ctx.globalAlpha = frame.sceneOpacity;
  image('landscape', BOXES.landscape);
  frame.clouds.forEach(cloud => image('cloud', cloud));
  ctx.beginPath(); TRAJECTORY_POINTS.forEach((point, i) => { if (i) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); });
  ctx.strokeStyle='#fff9db'; ctx.lineWidth=3; ctx.setLineDash([2,12]); ctx.stroke(); ctx.setLineDash([]);
  image('island',BOXES.islandLeft); image('island',BOXES.islandRight); image('exit',BOXES.exit);
  ctx.save(); ctx.globalAlpha *= frame.portal;
  ctx.beginPath(); ctx.ellipse(602,331,16+frame.portal*18,35,0,0,Math.PI*2);
  ctx.fillStyle='#101f30'; ctx.fill(); ctx.strokeStyle='#92dcdd'; ctx.lineWidth=3; ctx.stroke(); ctx.restore();
  frame.stars.forEach(star => {
    ctx.save(); ctx.translate(star.x,star.y); ctx.rotate(star.rotation); ctx.scale(star.scale,star.scale); ctx.globalAlpha*=star.opacity;
    ctx.drawImage(sprites.star,-24,-24,48,48); ctx.restore();
    ctx.save(); ctx.globalAlpha*=star.sparkle;ctx.translate(star.x,star.y);ctx.strokeStyle='#fff7ca';ctx.lineWidth=3;
    for(let j=0;j<6;j++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(32,0);ctx.lineTo(44,0);ctx.stroke();} ctx.restore();
  });
  ctx.save();ctx.translate(frame.ball.x,frame.ball.y);ctx.scale(frame.ball.scale,frame.ball.scale);ctx.rotate(frame.ball.rotation);ctx.globalAlpha*=frame.ball.opacity;
  ctx.drawImage(sprites.ball,-23,-23,46,46);ctx.restore();
  ctx.fillStyle='#497b7d';ctx.font='800 13px "Trebuchet MS"';ctx.textAlign='center';ctx.fillText(`${frame.activeStars} / 3 STARS`,400,133);
  ctx.restore();
  ctx.fillStyle='#285647';ctx.strokeStyle='#c29a55';ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect(344,535,350,72,22);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(382,607);ctx.lineTo(395,624);ctx.lineTo(407,607);ctx.fill();
  ctx.textAlign='left';ctx.fillStyle='#c9dfc9';ctx.font='800 11px "Trebuchet MS"';ctx.fillText('THE RULE ENGINE',367,561);
  ctx.fillStyle='#fff5db';ctx.font='bold 20px "Trebuchet MS"';ctx.fillText(frame.caption,367,586);
}
