import type { LevelDefinition } from '../levels/types';
import { PhysicsWorld, STEP_MS } from './world';
import { drawBakery } from './bakery-renderer';
import { drawGeometry } from './geometry-renderer';
import { drawStars } from './star-renderer';
import { sceneColours } from './drawing-theme';
import { SceneFeedback } from './scene-feedback';
import { ExitTransition, type PresentationTelemetry } from './exit-transition';
import { drawExitTransition } from './exit-transition-renderer';
import { AmbientScenery } from './ambient-scenery';
import { SceneSoundEvents } from '../audio/scene-sound-events';

export class CanvasLab {
  world: PhysicsWorld;
  private frame = 0;
  private previousTime = 0;
  private accumulator = 0;
  private lastReport = 0;
  private trail: [number, number][] = [];
  private observer: ResizeObserver;
  private context: CanvasRenderingContext2D;
  private feedback: SceneFeedback;
  private visualTime=0;
  private exit: ExitTransition;
  private scenery: AmbientScenery;
  private sounds: SceneSoundEvents;
  private destroyed = false;
  private motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  private motionChanged=()=>{ this.feedback.advance(this.visualTime,!!this.motion?.matches);this.exit.advance(0,!!this.motion?.matches);this.report();this.draw(); };
  private visible = () => { this.previousTime=0;if (document.hidden) { this.world.pause(); this.report(); } };

  constructor(private canvas: HTMLCanvasElement, readonly level: LevelDefinition, private reportState: (state: PresentationTelemetry) => void, private immersive = false) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot create the canvas.');
    this.world = new PhysicsWorld(level);
    this.exit = new ExitTransition(level);
    this.scenery = new AmbientScenery(level.viewport.width,level.viewport.height);
    this.feedback = new SceneFeedback(this.world);
    this.sounds = new SceneSoundEvents(this.world);
    this.context = context;
    this.canvas.style.aspectRatio = `${level.viewport.width} / ${level.viewport.height}`;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    document.addEventListener('visibilitychange', this.visible);
    this.motion?.addEventListener('change',this.motionChanged);
    this.resize();
    this.report();
    this.frame = requestAnimationFrame(this.animate);
  }
  get isAbsorbing() { return this.exit.phase === 'absorbing'; }
  report() {
    if (this.destroyed) return;
    this.exit.capture(this.world,!!this.motion?.matches);
    this.sounds.transition(this.exit.phase);
    this.reportState({...this.world.snapshot(),exitTransition:this.exit.phase});
  }
  reset() {
    const seen = this.world.seenTutorials;
    this.feedback.dispose();this.sounds.dispose();this.world.destroy(); this.world = new PhysicsWorld(this.level,seen); this.trail = []; this.accumulator = 0;
    this.feedback=new SceneFeedback(this.world);this.visualTime=0;
    this.exit.reset();this.previousTime=0;
    this.scenery.dispose();this.scenery=new AmbientScenery(this.level.viewport.width,this.level.viewport.height);
    this.sounds=new SceneSoundEvents(this.world);
    this.report(); this.draw();
  }
  retry() {
    const previous = this.world;
    this.feedback.dispose();this.sounds.dispose();this.world = previous.retryWithRules(); previous.destroy();
    this.feedback=new SceneFeedback(this.world);this.visualTime=0;
    this.exit.reset();this.previousTime=0;
    this.scenery.dispose();this.scenery=new AmbientScenery(this.level.viewport.width,this.level.viewport.height);
    this.sounds=new SceneSoundEvents(this.world);
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
    if (this.destroyed) return;
    const phaseBefore = this.exit.phase;
    const delta = document.hidden ? 0 : Math.min(time - (this.previousTime || time), 50);
    this.previousTime = time;
    this.visualTime+=delta/1000;
    this.scenery.advance(delta/1000,this.world.rules.acceleration,!document.hidden&&this.world.running,!!this.motion?.matches);
    this.feedback.advance(this.visualTime,!!this.motion?.matches);
    if (this.world.running) {
      this.accumulator += delta;
      while (this.accumulator >= STEP_MS && this.world.running) {
        this.world.step(); this.accumulator -= STEP_MS;
        this.feedback.capture();
        this.sounds.capture();
        if (this.world.tick % 6 === 0) {
          this.trail.push([this.world.ball.position.x, this.world.ball.position.y]);
          if (this.trail.length > 220) this.trail.shift();
        }
      }
    } else this.accumulator = 0;
    this.exit.capture(this.world,!!this.motion?.matches);
    this.exit.advance(delta/1000,!!this.motion?.matches);
    this.sounds.transition(this.exit.phase);
    this.draw();
    if (this.exit.phase !== phaseBefore || time - this.lastReport > 120) { this.report(); this.lastReport = time; }
    this.frame = requestAnimationFrame(this.animate);
  };
  private draw() {
    const ctx = this.context;
    const { width, height } = this.level.viewport;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = this.level.presentation === 'bakery' ? sceneColours.bakeryBackground : sceneColours.background; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const ratio = window.devicePixelRatio || 1;
    // The canvas fills the screen; reserve readable space for floating game controls.
    // These CSS tokens are shared with the HUD so it cannot hide the pickup target.
    const style = this.immersive ? getComputedStyle(this.canvas) : null;
    const inset = (name: string) => style ? (parseFloat(style.getPropertyValue(`--scene-${name}`)) || 0) * ratio : 0;
    const left = inset('left'), right = inset('right'), top = inset('top'), bottom = inset('bottom');
    const availableWidth = Math.max(1,this.canvas.width-left-right), availableHeight = Math.max(1,this.canvas.height-top-bottom);
    const scale = Math.min(availableWidth / width, availableHeight / height);
    ctx.setTransform(scale, 0, 0, scale, left+(availableWidth-width*scale)/2, top+(availableHeight-height*scale)/2);
    const ambient = this.scenery.snapshot();
    const actorPose=this.feedback.actorPose;
    if (this.level.presentation === 'bakery') drawBakery(ctx, this.world, this.trail,ambient,!!this.motion?.matches,actorPose);
    else drawGeometry(ctx,this.world,this.trail,ambient,!!this.motion?.matches,actorPose);
    drawStars(ctx,this.world,this.visualTime,!!this.motion?.matches);
    this.feedback.draw(ctx);
    drawExitTransition(ctx,this.level,this.exit.visual);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed=true;this.exit.reset();this.scenery.dispose();this.sounds.dispose();
    cancelAnimationFrame(this.frame); this.observer.disconnect();
    this.motion?.removeEventListener('change',this.motionChanged);this.feedback.dispose();
    document.removeEventListener('visibilitychange', this.visible); this.world.destroy();
  }
}
