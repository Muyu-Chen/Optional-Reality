import type { LevelDefinition } from '../levels/types';
import { PhysicsWorld, STEP_MS, type Telemetry } from './world';
import { drawBakery } from './bakery-renderer';
import { drawGeometry } from './geometry-renderer';

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

  constructor(private canvas: HTMLCanvasElement, readonly level: LevelDefinition, private reportState: (state: Telemetry) => void, private immersive = false) {
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
    const seen = this.world.seenTutorials;
    this.world.destroy(); this.world = new PhysicsWorld(this.level,seen); this.trail = []; this.accumulator = 0;
    this.report(); this.draw();
  }
  retry() {
    const previous = this.world;
    this.world = previous.retryWithRules(); previous.destroy();
    this.trail = []; this.accumulator = 0;
    this.world.start(); this.report(); this.draw();
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = this.level.presentation === 'bakery' ? '#f5edde' : '#f2f5ed'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const ratio = window.devicePixelRatio || 1;
    // The canvas fills the screen; reserve readable space for floating game controls.
    // These CSS tokens are shared with the HUD so it cannot hide the pickup target.
    const style = this.immersive ? getComputedStyle(this.canvas) : null;
    const inset = (name: string) => style ? (parseFloat(style.getPropertyValue(`--scene-${name}`)) || 0) * ratio : 0;
    const left = inset('left'), right = inset('right'), top = inset('top'), bottom = inset('bottom');
    const availableWidth = Math.max(1,this.canvas.width-left-right), availableHeight = Math.max(1,this.canvas.height-top-bottom);
    const scale = Math.min(availableWidth / width, availableHeight / height);
    ctx.setTransform(scale, 0, 0, scale, left+(availableWidth-width*scale)/2, top+(availableHeight-height*scale)/2);
    if (this.level.presentation === 'bakery') { drawBakery(ctx, this.world, this.trail); return; }
    drawGeometry(ctx,this.world,this.trail);
  }

  destroy() {
    cancelAnimationFrame(this.frame); this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.visible); this.world.destroy();
  }
}
