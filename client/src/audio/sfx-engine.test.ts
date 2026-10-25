import { describe, expect, it, vi } from 'vitest';
import { SfxEngine } from './sfx-engine';

function audio() {
  const parameter = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  const makeGain = () => ({ gain: parameter(), connect: vi.fn(), disconnect: vi.fn() });
  const makeVoice = () => ({ frequency: parameter(), connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as (() => void) | null });
  const voices: ReturnType<typeof makeVoice>[] = [], gains: ReturnType<typeof makeGain>[] = [];
  const context = { currentTime: 0, state: 'suspended', destination: {},
    createGain: vi.fn(() => { const gain = makeGain(); gains.push(gain); return gain; }),
    createOscillator: vi.fn(() => { const voice = makeVoice(); voices.push(voice); return voice; }),
    resume: vi.fn(async () => { context.state = 'running'; }), close: vi.fn(async () => { context.state = 'closed'; }),
  };
  const factory = vi.fn(() => context as unknown as AudioContext);
  const engine = new SfxEngine(factory);
  return { engine, context, factory, voices, gains };
}

describe('original sound effect graph', () => {
  it('creates no graph or notes before unlock and reuses one low-volume context', async () => {
    const { engine, factory, voices, gains } = audio();
    engine.play({ kind: 'star', collected: 1 });
    expect(factory).not.toHaveBeenCalled();
    expect(await engine.unlock()).toBe(true);
    expect(await engine.unlock()).toBe(true);
    expect(factory).toHaveBeenCalledOnce();
    expect(gains[0].gain.value).toBe(.16);
    expect(voices).toHaveLength(0);
    engine.play({ kind: 'rule' });
    expect(voices).toHaveLength(2);
    engine.dispose();
  });

  it('raises the pickup pitch with collection progress without unbounded frequencies', async () => {
    const { engine, voices } = audio(); await engine.unlock();
    for (const collected of [1, 2, 3, Infinity]) engine.play({ kind: 'star', collected });
    const pitches = voices.filter((_, index) => index % 2 === 0).map(voice => voice.frequency.setValueAtTime.mock.calls[0][0]);
    expect(pitches[1]).toBeGreaterThan(pitches[0]);
    expect(pitches[2]).toBeGreaterThan(pitches[1]);
    expect(pitches.every(pitch => Number.isFinite(pitch) && pitch < 2000)).toBe(true);
    engine.dispose();
  });

  it('caps simultaneous sources and disconnects stolen or ended voices', async () => {
    const { engine, voices } = audio(); await engine.unlock();
    for (let index = 0; index < 30; index++) engine.play({ kind: 'star', collected: 1 });
    expect(voices.filter(voice => voice.onended !== null)).toHaveLength(12);
    expect(voices[0].disconnect).toHaveBeenCalledOnce();
    const final = voices.at(-1)!; final.onended!();
    expect(final.disconnect).toHaveBeenCalledOnce();
    engine.dispose();
    expect(final.stop).toHaveBeenCalledOnce();
  });

  it('uses an upward spring cue and downward exit sweep, replacing previous tails', async () => {
    const { engine, voices } = audio(); await engine.unlock();
    engine.play({ kind: 'spring' });
    expect(voices[0].frequency.exponentialRampToValueAtTime.mock.calls[0][0]).toBeGreaterThan(voices[0].frequency.setValueAtTime.mock.calls[0][0]);
    engine.play({ kind: 'exit' });
    expect(voices[0].disconnect).toHaveBeenCalledOnce();
    const sweep = voices[2];
    expect(sweep.frequency.exponentialRampToValueAtTime.mock.calls[0][0]).toBeLessThan(sweep.frequency.setValueAtTime.mock.calls[0][0]);
    engine.play({ kind: 'complete' });
    expect(voices).toHaveLength(7);
    engine.dispose();
  });

  it('cancels every active and future note and disposes the graph only once', async () => {
    const { engine, voices, gains, context } = audio(); await engine.unlock();
    engine.play({ kind: 'complete' });
    expect(voices[2].start.mock.calls[0][0]).toBeGreaterThan(0);
    engine.cancel();
    for (const voice of voices) {
      expect(voice.stop).toHaveBeenCalledTimes(2);
      expect(voice.disconnect).toHaveBeenCalledOnce();
      expect(voice.onended).toBeNull();
    }
    expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    engine.dispose(); engine.dispose();
    expect(context.close).toHaveBeenCalledOnce();
    expect(gains[0].disconnect).toHaveBeenCalledOnce();
    expect(await engine.unlock()).toBe(false);
    engine.play({ kind: 'star', collected: 1 });
    expect(voices).toHaveLength(3);
  });

  it('rejects a stale unlock result after cancellation or disposal', async () => {
    for (const dispose of [false, true]) {
      const { engine, context, voices } = audio();
      let resolve!: () => void;
      context.resume.mockImplementationOnce(() => new Promise<void>(done => { resolve = () => { context.state = 'running'; done(); }; }));
      const pending = engine.unlock();
      if (dispose) engine.dispose(); else engine.cancel();
      resolve();
      expect(await pending).toBe(false);
      expect(voices).toHaveLength(0);
      engine.dispose();
    }
  });

  it('reports unsupported audio and refused resume without scheduling any cue', async () => {
    const unsupported = new SfxEngine(() => { throw new Error('no AudioContext'); });
    await expect(unsupported.unlock()).rejects.toMatchObject({ name: 'NotSupportedError' });
    unsupported.dispose();
    const { engine, context, voices } = audio();
    context.resume.mockRejectedValueOnce(new Error('NotAllowedError'));
    await expect(engine.unlock()).rejects.toThrow('NotAllowedError');
    expect(voices).toHaveLength(0);
    engine.dispose();
  });

  it('closes a partially constructed graph when the browser cannot create its gain node', async () => {
    const { context, factory } = audio();
    context.createGain.mockImplementation(() => { throw new Error('graph unavailable'); });
    const engine = new SfxEngine(factory);
    await expect(engine.unlock()).rejects.toMatchObject({ name: 'NotSupportedError' });
    expect(context.close).toHaveBeenCalledOnce();
    engine.dispose();
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('reports an interrupted graph so the controller can retry on the next gesture', async () => {
    const { engine, context, voices } = audio();
    await engine.unlock();
    context.state = 'suspended';
    expect(() => engine.play({ kind: 'rule' })).toThrow('suspended');
    expect(voices).toHaveLength(0);
    await engine.unlock();
    engine.play({ kind: 'rule' });
    expect(voices).toHaveLength(2);
    engine.dispose();
  });
});
