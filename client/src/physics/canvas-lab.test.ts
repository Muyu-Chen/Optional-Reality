vi.mock('./star-renderer', () => ({drawStars:vi.fn()}));
vi.mock('./acceleration-renderer', () => ({drawAcceleration:vi.fn()}));
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { CanvasLab } from './canvas-lab';
import Matter from 'matter-js';
import { drawExitTransition } from './exit-transition-renderer';
import { drawPuzzleBackdrop } from './scene-backdrop';

vi.mock('./geometry-renderer', () => ({ drawGeometry: vi.fn() }));
vi.mock('./scene-backdrop', () => ({ drawPuzzleBackdrop: vi.fn() }));
vi.mock('./bakery-renderer', () => ({ drawBakery: vi.fn() }));
vi.mock('./exit-transition-renderer', () => ({ drawExitTransition: vi.fn() }));

const labs: CanvasLab[] = [];
let frames: Map<number, FrameRequestCallback>, nextFrame: number;
let disconnect: ReturnType<typeof vi.fn>;
let context: Record<'setTransform'|'clearRect'|'fillRect'|'save'|'restore'|'beginPath'|'rect'|'clip',ReturnType<typeof vi.fn>>;
let motion: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

beforeEach(() => {
  frames = new Map(); nextFrame = 0;
  disconnect = vi.fn();
  context = { setTransform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(),save:vi.fn(),restore:vi.fn(),beginPath:vi.fn(),rect:vi.fn(),clip:vi.fn() };
  motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', () => motion);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect; });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback); return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});
afterEach(() => {
  labs.splice(0).forEach(lab => lab.destroy());
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

function frame(time: number) {
  const [id, callback] = frames.entries().next().value!;
  frames.delete(id);
  callback(time);
}
function setup(immersive = false, configure?: (canvas: HTMLCanvasElement) => void) {
  const canvas = document.createElement('canvas');
  Object.defineProperties(canvas, { clientWidth: { value: 1366 }, clientHeight: { value: 768 } });
  configure?.(canvas);
  const report = vi.fn();
  const lab = new CanvasLab(canvas, gravityLab, report, immersive);
  labs.push(lab);
  return { lab, canvas, report };
}

describe('Canvas lifecycle and fixed simulation time', () => {
  it.each([30, 60, 144])('advances one simulated second consistently at %s rendered frames/second', rate => {
    const { lab } = setup();
    lab.world.setGravity(1); lab.world.start();
    frame(1);
    for (let i = 1; i <= rate; i++) frame(1 + i * 1000 / rate);
    expect(lab.world.tick).toBeGreaterThanOrEqual(119);
    expect(lab.world.tick).toBeLessThanOrEqual(120);
    expect(lab.world.ball.position.y).toBeGreaterThan(165);
  });

  it('caps catch-up after a long frame and never advances while paused', () => {
    const { lab } = setup();
    lab.world.start();
    frame(1); frame(10001);
    expect(lab.world.tick).toBeLessThanOrEqual(6);
    const tick = lab.world.tick;
    lab.world.pause(); frame(11001); frame(12001);
    expect(lab.world.tick).toBe(tick);
    lab.world.start(); frame(12018);
    expect(lab.world.tick).toBeLessThanOrEqual(tick + 3);
  });

  it('pauses on hidden tabs and removes animation, observers and listeners on destroy', () => {
    const { lab, report } = setup();
    lab.world.start();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(lab.world.running).toBe(false);
    expect(report.mock.lastCall?.[0].running).toBe(false);
    lab.destroy();
    expect(frames.size).toBe(0);
    expect(disconnect).toHaveBeenCalled();
    const count = report.mock.calls.length;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(report).toHaveBeenCalledTimes(count);
  });

  it('resets the world and history while preserving completed teaching', () => {
    const { lab } = setup();
    const old = lab.world;
    old.seenTutorials.add('seen');
    old.applyMessages([{ text: 'gravity', operations: [{ type: 'set_gravity', acceleration: 2 }] }]);
    old.start(); frame(1); frame(40);
    lab.reset();
    expect(lab.world).not.toBe(old);
    expect(lab.world.snapshot()).toMatchObject({ acceleration:{x:0,y:0}, tick: 0, running: false, started: false });
    expect(lab.world.commandCount).toBe(0);
    expect(lab.world.seenTutorials.has('seen')).toBe(true);
    expect(old.engine.world.bodies).toHaveLength(0);
  });

  it('keeps the whole scene within HUD insets at high pixel density', () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const { canvas } = setup(true, canvas => {
      for (const [side, value] of Object.entries({ left: 28, right: 366, top: 96, bottom: 78 })) {
        canvas.style.setProperty(`--scene-${side}`, `${value}px`);
      }
    });
    expect(canvas.width).toBe(2732);
    expect(canvas.height).toBe(1536);
    const [scale, , , , x, y] = context.setTransform.mock.lastCall!;
    expect(x).toBeGreaterThanOrEqual(56);
    expect(y).toBeGreaterThanOrEqual(192);
    expect(x + 800 * scale).toBeLessThanOrEqual(canvas.width - 732 + .001);
    expect(y + 510 * scale).toBeLessThanOrEqual(canvas.height - 156 + .001);
    // The illustration spans the entire CSS viewport, independently from the fitted playable world.
    expect(vi.mocked(drawPuzzleBackdrop).mock.lastCall?.slice(1,3)).toEqual([1366,768]);
    expect(context.rect).toHaveBeenLastCalledWith(0,0,gravityLab.viewport.width,gravityLab.viewport.height);
    expect(context.clip).toHaveBeenCalled();
    expect(context.save.mock.calls.length).toBe(context.restore.mock.calls.length);
  });

  it('freezes the decorative world on pause and rebuilds its deterministic initial state on reset',()=>{
    const {lab}=setup();const initial=structuredClone(vi.mocked(drawPuzzleBackdrop).mock.lastCall![3]);
    lab.world.start();frame(1);frame(51);const moving=structuredClone(vi.mocked(drawPuzzleBackdrop).mock.lastCall![3]);
    expect(moving.time).toBeGreaterThan(0);lab.world.pause();frame(10001);
    expect(vi.mocked(drawPuzzleBackdrop).mock.lastCall![3]).toEqual(moving);
    lab.reset();expect(vi.mocked(drawPuzzleBackdrop).mock.lastCall![3]).toEqual(initial);
  });
});

function reachExit(lab: CanvasLab) {
  const exit = lab.world.level.exit;
  Matter.Body.setPosition(lab.world.ball, { x: exit.x + exit.width / 2, y: exit.y + exit.height / 2 });
  lab.world.start();frame(1);frame(18);
  expect(lab.world.won).toBe(true);
}

describe('Canvas exit presentation lifecycle', () => {
  it('reports success immediately but releases the result only after the visual absorption', () => {
    const { lab, report } = setup();reachExit(lab);
    const result = lab.world.snapshot(), position = { ...lab.world.ball.position };
    expect(report.mock.lastCall![0]).toMatchObject({ won: true, exitTransition: 'absorbing' });
    expect(lab.isAbsorbing).toBe(true);
    for (let i = 1; i <= 20; i++) frame(18 + i * 50);
    expect(lab.isAbsorbing).toBe(true);
    for (let i = 21; i <= 24; i++) frame(18 + i * 50);
    expect(report.mock.lastCall![0]).toMatchObject({ won: true, exitTransition: 'complete' });
    expect(lab.isAbsorbing).toBe(false);
    expect(lab.world.snapshot()).toEqual(result);expect(lab.world.ball.position).toEqual(position);
    expect(vi.mocked(drawExitTransition).mock.lastCall![2]!.actor.scale).toBe(0);
  });

  it('does not advance an absorption in the background or jump on return', () => {
    const { lab, report } = setup();reachExit(lab);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    frame(10001);frame(20001);
    expect(lab.isAbsorbing).toBe(true);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));frame(30001);
    expect(report.mock.lastCall![0].exitTransition).toBe('absorbing');
    for (let i = 1; i <= 24; i++) frame(30001 + i * 50);
    expect(report.mock.lastCall![0].exitTransition).toBe('complete');
  });

  it('cancels a pending completion on retry and ignores already retained RAF callbacks after destroy', () => {
    const { lab, report } = setup();reachExit(lab);lab.reset();
    for (let i = 1; i <= 30; i++) frame(18 + i * 50);
    expect(report.mock.lastCall![0]).toMatchObject({ won: false, exitTransition: 'idle' });
    const stale = frames.values().next().value!;
    const reports = report.mock.calls.length;lab.destroy();stale(10000);
    expect(frames.size).toBe(0);expect(report).toHaveBeenCalledTimes(reports);
  });

  it('skips absorption for reduced motion and responds immediately to a preference change', () => {
    const { lab, report } = setup();reachExit(lab);
    motion.matches = true;
    const changed = motion.addEventListener.mock.calls.find(([event]) => event === 'change')![1];changed();
    expect(report.mock.lastCall![0].exitTransition).toBe('complete');
    lab.reset();reachExit(lab);
    expect(report.mock.lastCall![0].exitTransition).toBe('complete');
  });
});
