import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicEngine } from './music-engine';

function audioGraph() {
  const parameter = () => ({ value: 0, setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(),
    linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const gains: ReturnType<typeof makeGain>[] = [];
  const makeGain = () => ({ gain: parameter(), connect: vi.fn(), disconnect: vi.fn() });
  const voices: ReturnType<typeof makeVoice>[] = [];
  const makeVoice = () => ({ frequency: parameter(), type: 'sine', connect: vi.fn(), disconnect: vi.fn(),
    start: vi.fn(), stop: vi.fn(), onended: null as (() => void) | null });
  const filter = { type: 'lowpass', frequency: parameter(), Q: parameter(), connect: vi.fn(), disconnect: vi.fn() };
  const context = {
    currentTime: 0, state: 'suspended', destination: {},
    createGain: vi.fn(() => { const gain = makeGain(); gains.push(gain); return gain; }),
    createBiquadFilter: vi.fn(() => filter),
    createOscillator: vi.fn(() => { const voice = makeVoice(); voices.push(voice); return voice; }),
    resume: vi.fn(async () => { context.state = 'running'; }),
    suspend: vi.fn(async () => { context.state = 'suspended'; }),
    close: vi.fn(async () => { context.state = 'closed'; }),
  };
  const factory = vi.fn(() => context as unknown as AudioContext);
  const engine = new MusicEngine(factory);
  return { context, factory, engine, voices, gains, filter };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('music audio graph lifecycle', () => {
  it('creates no graph until play, limits the master gain, and uses one scheduler', async () => {
    const { engine, factory, context, gains, voices } = audioGraph();
    expect(factory).not.toHaveBeenCalled();
    await engine.play();
    expect(factory).toHaveBeenCalledOnce();
    expect(voices).toHaveLength(5); // Three pad voices, one bass and one melody.
    expect(gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(.45, .4);
    expect(vi.getTimerCount()).toBe(1);
    await engine.play();
    expect(factory).toHaveBeenCalledOnce();
    expect(context.createOscillator).toHaveBeenCalledTimes(5);
    expect(vi.getTimerCount()).toBe(1);
    engine.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops all active and scheduled notes on mute and reuses the same graph on resume', async () => {
    const { engine, context, factory, voices } = audioGraph();
    await engine.play();
    engine.pause();
    expect(vi.getTimerCount()).toBe(0);
    expect(context.suspend).toHaveBeenCalledOnce();
    for (const voice of voices) {
      expect(voice.stop).toHaveBeenCalledTimes(2);
      expect(voice.disconnect).toHaveBeenCalledOnce();
    }
    context.currentTime = 1;
    await engine.play();
    expect(factory).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);
    engine.dispose();
  });

  it('does not resurrect playback if resume completes after a mute', async () => {
    const { engine, context, voices } = audioGraph();
    let resolve!: () => void;
    context.resume.mockImplementationOnce(() => new Promise<void>(done => { resolve = () => { context.state = 'running'; done(); }; }));
    const pending = engine.play();
    engine.pause();
    resolve();
    expect(await pending).toBe(false);
    expect(context.state).toBe('suspended');
    expect(voices).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    engine.dispose();
  });

  it('cleans the graph once on disposal, including when browser resume is pending', async () => {
    const { engine, context, voices, filter, gains } = audioGraph();
    let resolve!: () => void;
    context.resume.mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
    const pending = engine.play();
    engine.dispose();
    engine.dispose();
    resolve();
    expect(await pending).toBe(false);
    expect(context.close).toHaveBeenCalledOnce();
    expect(filter.disconnect).toHaveBeenCalledOnce();
    expect(gains[0].disconnect).toHaveBeenCalledOnce();
    expect(voices).toHaveLength(0);
    expect(await engine.play()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('releases ended voices and skips a throttled timer backlog', async () => {
    const { engine, context, voices } = audioGraph();
    await engine.play();
    const first = voices[0];
    first.onended?.();
    expect(first.disconnect).toHaveBeenCalledOnce();
    context.currentTime = 120;
    vi.advanceTimersByTime(125);
    expect(voices.length).toBeLessThan(12);
    for (const voice of voices.slice(5)) expect(voice.start.mock.calls[0][0]).toBeGreaterThan(120);
    engine.dispose();
    expect(first.stop).toHaveBeenCalledOnce();
  });

  it('rejects browser policy failures without creating a scheduler', async () => {
    const { engine, context } = audioGraph();
    context.resume.mockRejectedValueOnce(new Error('NotAllowedError'));
    await expect(engine.play()).rejects.toThrow('NotAllowedError');
    expect(vi.getTimerCount()).toBe(0);
    engine.dispose();
  });
});
