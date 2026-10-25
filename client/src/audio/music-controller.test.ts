import { describe, expect, it, vi } from 'vitest';
import { MusicController, musicPreferenceKey } from './music-controller';

function harness(saved: string | null = null) {
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const page = {
    visibilityState: 'visible',
    addEventListener: vi.fn((name: string, listener: EventListenerOrEventListenerObject) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(listener);
    }),
    removeEventListener: vi.fn((name: string, listener: EventListenerOrEventListenerObject) => listeners.get(name)?.delete(listener)),
  };
  const emit = (name: string, isTrusted = true) => {
    for (const listener of listeners.get(name) || []) {
      if (typeof listener === 'function') listener({ isTrusted } as Event);
    }
  };
  const engine = { play: vi.fn().mockResolvedValue(true), pause: vi.fn(), dispose: vi.fn() };
  const create = vi.fn(() => engine);
  const store = { getItem: vi.fn(() => saved), setItem: vi.fn() };
  const controller = new MusicController(page as unknown as Document, create, store);
  controller.attach();
  return { controller, engine, create, page, emit, store, listeners };
}

async function flush() { await Promise.resolve(); await Promise.resolve(); }

describe('background music policy', () => {
  it('waits for a trusted gesture, creates only one player, and does not duplicate listeners', async () => {
    const { controller, create, engine, emit, page } = harness();
    controller.attach();
    expect(page.addEventListener).toHaveBeenCalledTimes(3);
    expect(create).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toEqual({ enabled: true, status: 'waiting' });
    emit('pointerdown', false);
    emit('keydown', false);
    expect(create).not.toHaveBeenCalled();
    emit('keydown');
    emit('pointerdown');
    await flush();
    emit('pointerdown');
    expect(create).toHaveBeenCalledTimes(1);
    expect(engine.play).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().status).toBe('playing');
    controller.dispose();
  });

  it('retains an opt-out and immediately silences playback when toggled off', async () => {
    const { controller, emit, create, engine, store } = harness('off');
    emit('pointerdown');
    expect(create).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toEqual({ enabled: false, status: 'muted' });
    controller.toggle(true);
    await flush();
    expect(engine.play).toHaveBeenCalledOnce();
    expect(store.setItem).toHaveBeenLastCalledWith(musicPreferenceKey, 'on');
    controller.toggle(true);
    expect(engine.pause).toHaveBeenCalledOnce();
    expect(store.setItem).toHaveBeenLastCalledWith(musicPreferenceKey, 'off');
    emit('pointerdown');
    expect(engine.play).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it('pauses hidden tabs and restores only an enabled player with a previous gesture', async () => {
    const { controller, emit, page, engine, create } = harness();
    page.visibilityState = 'hidden';
    emit('visibilitychange');
    page.visibilityState = 'visible';
    emit('visibilitychange');
    expect(create).not.toHaveBeenCalled();
    emit('pointerdown');
    await flush();
    page.visibilityState = 'hidden';
    emit('visibilitychange');
    expect(engine.pause).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().status).toBe('waiting');
    page.visibilityState = 'visible';
    emit('visibilitychange');
    await flush();
    expect(engine.play).toHaveBeenCalledTimes(2);
    controller.toggle();
    page.visibilityState = 'hidden'; emit('visibilitychange');
    page.visibilityState = 'visible'; emit('visibilitychange');
    expect(engine.play).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it('ignores a late successful start after muting or disposal', async () => {
    const { controller, engine, emit, listeners } = harness();
    let resolve!: (value: boolean) => void;
    engine.play.mockImplementation(() => new Promise<boolean>(done => { resolve = done; }));
    emit('pointerdown');
    controller.toggle();
    resolve(true);
    await flush();
    expect(controller.getSnapshot()).toEqual({ enabled: false, status: 'muted' });
    controller.toggle(true);
    controller.dispose();
    controller.dispose();
    resolve(true);
    await flush();
    expect(engine.dispose).toHaveBeenCalledOnce();
    expect([...listeners.values()].every(set => !set.size)).toBe(true);
    emit('pointerdown');
    expect(engine.play).toHaveBeenCalledTimes(2);
  });

  it('contains browser resume errors and retries on a subsequent gesture', async () => {
    const { controller, engine, emit } = harness();
    engine.play.mockRejectedValueOnce(new Error('NotAllowedError'));
    emit('pointerdown');
    await flush();
    expect(controller.getSnapshot().status).toBe('blocked');
    emit('keydown');
    await flush();
    expect(controller.getSnapshot().status).toBe('playing');
    controller.dispose();
  });

  it('keeps usable in-memory controls when reading and writing storage fails', async () => {
    const store = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    const { page, engine } = harness();
    const controller = new MusicController(page as unknown as Document, () => engine, store);
    expect(controller.getSnapshot().enabled).toBe(true);
    expect(() => controller.toggle()).not.toThrow();
    expect(controller.getSnapshot().enabled).toBe(false);
    expect(() => controller.toggle(true)).not.toThrow();
    await flush();
    expect(controller.getSnapshot().status).toBe('playing');
    controller.dispose();
  });

  it('contains unavailable player creation and allows music to be turned off', () => {
    const { page } = harness();
    const controller = new MusicController(page as unknown as Document, () => { throw new Error('unsupported'); });
    controller.toggle();
    expect(() => controller.toggle(true)).not.toThrow();
    expect(controller.getSnapshot().status).toBe('unavailable');
    controller.toggle();
    expect(controller.getSnapshot().status).toBe('muted');
    controller.dispose();
  });
});
