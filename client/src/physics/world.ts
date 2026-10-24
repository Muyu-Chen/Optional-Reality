import Matter from 'matter-js';

const { Engine, Bodies, Composite } = Matter;
export const WIDTH = 800;
export const HEIGHT = 510;
export const PIXELS_PER_METRE = 80;
export const STEP_MS = 1000 / 120;
export const ROUND_SECONDS = 30;
export const ROUND_TICKS = Math.round(ROUND_SECONDS * 1000 / STEP_MS);
export const EXIT = { x: 728, y: 253, width: 49, height: 68 };
const RADIUS = 17;

function touchesExit({ x, y }: Matter.Vector) {
  const closestX = Math.max(EXIT.x, Math.min(x, EXIT.x + EXIT.width));
  const closestY = Math.max(EXIT.y, Math.min(y, EXIT.y + EXIT.height));
  return (x - closestX) ** 2 + (y - closestY) ** 2 <= RADIUS ** 2;
}
function curve(points: [number, number][], steps: number): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps, u = 1 - t;
    return [0, 1].map(axis => u ** 3 * points[0][axis] + 3 * u ** 2 * t * points[1][axis] + 3 * u * t ** 2 * points[2][axis] + t ** 3 * points[3][axis]) as [number, number];
  });
}
const TRACK: [number, number][] = [
  ...curve([[90, 175], [200, 285], [260, 400], [350, 400]], 28),
  ...curve([[350, 400], [440, 400], [470, 305], [555, 305]], 28).slice(1),
  [590, 305],
];
export interface Telemetry { running: boolean; started: boolean; gravity: number; tick: number; won: boolean; timedOut: boolean; x: number; y: number }

export class PhysicsWorld {
  engine: Matter.Engine;
  ball: Matter.Body;
  gravity = 0;
  tick = 0;
  started = false;
  running = false;
  won = false;
  timedOut = false;

  constructor() {
    this.engine = Engine.create({ gravity: { x: 0, y: 0, scale: PIXELS_PER_METRE / 1_000_000 } });
    const surface = { isStatic: true, friction: 0, restitution: 0, label: 'track' };
    const rails: Matter.Body[] = [];
    for (let i = 0; i < TRACK.length - 1; i++) {
      const [a, b] = [TRACK[i], TRACK[i + 1]];
      rails.push(Bodies.rectangle((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(b[0] - a[0], b[1] - a[1]) + 2, 10, { ...surface, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) }));
    }
    for (const [x, y] of TRACK) rails.push(Bodies.circle(x, y, 5, surface));
    this.ball = Bodies.circle(165, 135, RADIUS, { friction: 0, frictionStatic: 0, frictionAir: 0, restitution: .02, label: 'ball-A' });
    Composite.add(this.engine.world, [
      ...rails, this.ball,
      Bodies.rectangle(400, HEIGHT + 18, 850, 36, surface),
      Bodies.rectangle(-18, HEIGHT / 2, 36, HEIGHT * 2, surface),
      Bodies.rectangle(WIDTH + 18, HEIGHT / 2, 36, HEIGHT * 2, surface),
      Bodies.rectangle(400, -18, 850, 36, surface),
    ]);
  }

  setGravity(value: number) {
    if (!Number.isFinite(value) || Math.abs(value) > 10) throw new Error('Gravity is outside the demo range.');
    this.gravity = value;
    this.engine.gravity.y = value;
  }
  start() { if (!this.won && !this.timedOut) { this.started = true; this.running = true; } }
  pause() { this.running = false; }
  step() {
    if (!this.running || this.won || this.timedOut) return;
    Engine.update(this.engine, STEP_MS);
    this.tick++;
    // Any part of the ball touching the visible exit counts, including its edges.
    if (touchesExit(this.ball.position)) {
      this.won = true;
      this.running = false;
    } else if (this.tick >= ROUND_TICKS) {
      this.timedOut = true;
      this.running = false;
    }
  }
  snapshot(): Telemetry {
    return { running: this.running, started: this.started, gravity: this.gravity, tick: this.tick, won: this.won, timedOut: this.timedOut, x: this.ball.position.x, y: this.ball.position.y };
  }
  destroy() { Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}

export class CanvasLab {
  world = new PhysicsWorld();
  private frame = 0;
  private previousTime = 0;
  private accumulator = 0;
  private lastReport = 0;
  private trail: [number, number][] = [];
  private observer: ResizeObserver;
  private context: CanvasRenderingContext2D;
  private visible = () => { if (document.hidden) { this.world.pause(); this.report(); } };

  constructor(private canvas: HTMLCanvasElement, private reportState: (state: Telemetry) => void) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot create the canvas.');
    this.context = context;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    document.addEventListener('visibilitychange', this.visible);
    this.resize();
    this.report();
    this.frame = requestAnimationFrame(this.animate);
  }
  report() { this.reportState(this.world.snapshot()); }
  reset() {
    this.world.destroy(); this.world = new PhysicsWorld(); this.trail = []; this.accumulator = 0;
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#fafcf7'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const scale = Math.min(this.canvas.width / WIDTH, this.canvas.height / HEIGHT);
    ctx.setTransform(scale, 0, 0, scale, (this.canvas.width - WIDTH * scale) / 2, (this.canvas.height - HEIGHT * scale) / 2);
    ctx.fillStyle = '#dce5d8';
    for (let x = 18; x < WIDTH; x += 28) for (let y = 18; y < HEIGHT; y += 28) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '14px ui-monospace, monospace'; ctx.fillStyle = '#7b8a7e';
    ctx.fillText('OPTIONAL REALITY / EXPERIMENTAL PHYSICS DIVISION', 30, 35);
    ctx.fillStyle = '#263a30'; ctx.fillRect(30, 55, 42, 42);
    ctx.fillStyle = '#fafcf7'; ctx.font = 'bold 28px system-ui, sans-serif'; ctx.fillText('01', 34, 86);
    ctx.font = '14px ui-monospace, monospace'; ctx.fillStyle = '#53695b';
    ctx.fillText('ZERO GRAVITY TO START', 87, 72); ctx.fillText('OBSERVE / QUEUE / SEND', 87, 91);
    ctx.strokeStyle = '#c4d0c0'; ctx.lineWidth = 2;
    for (const [x, y] of [TRACK[0], TRACK[28], TRACK[56]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, 454); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(45, 455); ctx.lineTo(770, 455); ctx.stroke();
    ctx.strokeStyle = '#263a30'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); TRACK.forEach(([x,y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)); ctx.stroke();
    if (this.trail.length > 1) {
      ctx.strokeStyle = '#8ca994'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]);
      ctx.beginPath(); this.trail.forEach(([x,y],i) => i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = this.world.won ? '#407d53' : '#263a30'; ctx.fillRect(EXIT.x, EXIT.y, EXIT.width, EXIT.height);
    ctx.strokeStyle = '#f7fbef'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(739, 287); ctx.lineTo(765, 287); ctx.moveTo(757, 279); ctx.lineTo(765, 287); ctx.lineTo(757, 295); ctx.stroke();
    ctx.fillStyle = '#263a30'; ctx.font = 'bold 17px ui-monospace, monospace'; ctx.fillText('EXIT', 732, 347);
    const { x, y } = this.world.ball.position;
    ctx.fillStyle = '#d5eb8d'; ctx.strokeStyle = '#263a30'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, RADIUS, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f3f9d9'; ctx.beginPath(); ctx.arc(x - 5, y - 5, 4.5, 0, Math.PI * 2); ctx.fill();
    if (!this.world.started) {
      ctx.fillStyle = '#758778'; ctx.font = '15px ui-monospace, monospace'; ctx.fillText('BALL A', 139, 110);
      ctx.fillText('NO GRAVITY. NO MOTION.', 47, 487);
    } else {
      ctx.fillStyle = '#758778'; ctx.font = '15px ui-monospace, monospace';
      ctx.fillText(this.world.won ? 'EXPERIMENT COMPLETE' : this.world.timedOut ? 'TIME IS UP. RESET TO TRY AGAIN.' : 'YOUR TIMING CHANGES THE OUTCOME.', 47, 487);
    }
  }
  destroy() {
    cancelAnimationFrame(this.frame); this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.visible); this.world.destroy();
  }
}
