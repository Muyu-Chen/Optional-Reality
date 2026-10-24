import type { LevelDefinition } from '../levels/types';
import { PhysicsWorld, STEP_MS, type Telemetry } from './world';

export class CanvasLab {
  world: PhysicsWorld;
  private frame = 0;
  private previousTime = 0;
  private accumulator = 0;
  private lastReport = 0;
  private trail: [number, number][] = [];
  private observer: ResizeObserver;
  private context: CanvasRenderingContext2D;
  private visible = () => { if (document.hidden) { this.world.pause(); this.report(); } };

  constructor(private canvas: HTMLCanvasElement, readonly level: LevelDefinition, private reportState: (state: Telemetry) => void) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot create the canvas.');
    this.world = new PhysicsWorld(level);
    this.context = context;
    this.canvas.style.aspectRatio = `${level.viewport.width} / ${level.viewport.height}`;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    document.addEventListener('visibilitychange', this.visible);
    this.resize();
    this.report();
    this.frame = requestAnimationFrame(this.animate);
  }
  report() { this.reportState(this.world.snapshot()); }
  reset() {
    this.world.destroy(); this.world = new PhysicsWorld(this.level); this.trail = []; this.accumulator = 0;
    this.report(); this.draw();
  }
  private resize() {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.canvas.clientWidth * ratio);
    this.canvas.height = Math.round(this.canvas.clientHeight * ratio);
    this.draw();
  }
  private animate = (time: number) => {
    const delta = Math.min(time - (this.previousTime || time), 50);
    this.previousTime = time;
    if (this.world.running) {
      this.accumulator += delta;
      while (this.accumulator >= STEP_MS && this.world.running) {
        this.world.step(); this.accumulator -= STEP_MS;
        if (this.world.tick % 6 === 0) {
          this.trail.push([this.world.ball.position.x, this.world.ball.position.y]);
          if (this.trail.length > 220) this.trail.shift();
        }
      }
    } else this.accumulator = 0;
    this.draw();
    if (time - this.lastReport > 120) { this.report(); this.lastReport = time; }
    this.frame = requestAnimationFrame(this.animate);
  };
  private draw() {
    const ctx = this.context;
    const { width, height } = this.level.viewport;
    const { ball, exit, tracks, guideLines, instructions } = this.level;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#fafcf7'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const scale = Math.min(this.canvas.width / width, this.canvas.height / height);
    ctx.setTransform(scale, 0, 0, scale, (this.canvas.width - width * scale) / 2, (this.canvas.height - height * scale) / 2);
    ctx.fillStyle = '#dce5d8';
    for (let x = 18; x < width; x += 28) for (let y = 18; y < height; y += 28) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '14px ui-monospace, monospace'; ctx.fillStyle = '#7b8a7e';
    ctx.fillText('OPTIONAL REALITY / EXPERIMENTAL PHYSICS DIVISION', 30, 35);
    ctx.fillStyle = '#263a30'; ctx.fillRect(30, 55, 42, 42);
    ctx.fillStyle = '#fafcf7'; ctx.font = 'bold 28px system-ui, sans-serif'; ctx.fillText(String(this.level.number).padStart(2, '0'), 34, 86);
    ctx.font = '14px ui-monospace, monospace'; ctx.fillStyle = '#53695b';
    ctx.fillText(instructions.canvasHeading, 87, 72); ctx.fillText('OBSERVE / QUEUE / SEND', 87, 91);
    ctx.strokeStyle = '#c4d0c0'; ctx.lineWidth = 2;
    for (const { from, to } of guideLines) { ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...to); ctx.stroke(); }
    ctx.strokeStyle = '#263a30'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const track of tracks) {
      ctx.lineWidth = track.thickness;
      ctx.beginPath(); track.points.forEach(([x,y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)); ctx.stroke();
    }
    if (this.trail.length > 1) {
      ctx.strokeStyle = '#8ca994'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]);
      ctx.beginPath(); this.trail.forEach(([x,y],i) => i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = this.world.won ? '#407d53' : '#263a30'; ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
    ctx.strokeStyle = '#f7fbef'; ctx.lineWidth = 3;
    const centreX = exit.x + exit.width / 2, centreY = exit.y + exit.height / 2;
    const arrowSize = Math.min(exit.width * .26, exit.height * .2);
    ctx.beginPath(); ctx.moveTo(centreX - arrowSize, centreY); ctx.lineTo(centreX + arrowSize, centreY);
    ctx.moveTo(centreX + arrowSize * .4, centreY - arrowSize * .6); ctx.lineTo(centreX + arrowSize, centreY); ctx.lineTo(centreX + arrowSize * .4, centreY + arrowSize * .6); ctx.stroke();
    ctx.fillStyle = '#263a30'; ctx.font = 'bold 17px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(exit.label, centreX, exit.y + exit.height + 26); ctx.textAlign = 'left';
    const { x, y } = this.world.ball.position;
    ctx.fillStyle = '#d5eb8d'; ctx.strokeStyle = '#263a30'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, ball.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f3f9d9'; ctx.beginPath(); ctx.arc(x - ball.radius * .3, y - ball.radius * .3, ball.radius * .26, 0, Math.PI * 2); ctx.fill();
    if (!this.world.started) {
      ctx.fillStyle = '#758778'; ctx.font = '15px ui-monospace, monospace'; ctx.textAlign = 'center';
      ctx.fillText(ball.label, x, y - ball.radius - 8); ctx.textAlign = 'left';
      ctx.fillText(instructions.readyCaption, 47, height - 23);
    } else {
      ctx.fillStyle = '#758778'; ctx.font = '15px ui-monospace, monospace';
      ctx.fillText(this.world.won ? 'EXPERIMENT COMPLETE' : this.world.timedOut ? 'TIME IS UP. RESET TO TRY AGAIN.' : 'YOUR TIMING CHANGES THE OUTCOME.', 47, height - 23);
    }
  }
  destroy() {
    cancelAnimationFrame(this.frame); this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.visible); this.world.destroy();
  }
}
