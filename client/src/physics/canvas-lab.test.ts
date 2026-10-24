// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { CanvasLab } from './canvas-lab';

vi.mock('./geometry-renderer', () => ({ drawGeometry: vi.fn() }));
vi.mock('./bakery-renderer', () => ({ drawBakery: vi.fn() }));

const labs: CanvasLab[] = [];
let frames: Map<number, FrameRequestCallback>, nextFrame: number;
let disconnect: ReturnType<typeof vi.fn>;
let context: { setTransform: ReturnType<typeof vi.fn>; clearRect: ReturnType<typeof vi.fn>; fillRect: ReturnType<typeof vi.fn> };

beforeEach(() => {
  frames = new Map(); nextFrame = 0;
  disconnect = vi.fn();
  context = { setTransform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn() };
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
    expect(lab.world.snapshot()).toMatchObject({ gravity: 0, tick: 0, running: false, started: false });
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
  });
});
