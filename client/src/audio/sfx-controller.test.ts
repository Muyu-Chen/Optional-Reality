import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitGameSound } from './game-sound-events';
import { SfxController, sfxPreferenceKey } from './sfx-controller';

const controllers: SfxController[] = [];
afterEach(() => { controllers.splice(0).forEach(controller => controller.dispose()); });
async function flush() { await Promise.resolve(); await Promise.resolve(); }

function harness(saved: string | null = null) {
  const listeners = new Map<string, Set<EventListener>>();
  const page = { visibilityState: 'visible',
    addEventListener: vi.fn((name: string, listener: EventListener) => {
      if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(listener);
    }),
    removeEventListener: vi.fn((name: string, listener: EventListener) => listeners.get(name)?.delete(listener)),
  };
  const gesture = (trusted = true) => { for (const listener of listeners.get('pointerdown') || []) listener({ isTrusted: trusted } as Event); };
  const visibility = (value: string) => { page.visibilityState = value; for (const listener of listeners.get('visibilitychange') || []) listener({} as Event); };
  const engine = { unlock: vi.fn().mockResolvedValue(true), play: vi.fn(), cancel: vi.fn(), dispose: vi.fn() };
  const factory = vi.fn(() => engine);
  const store = { getItem: vi.fn(() => saved), setItem: vi.fn() };
  const controller = new SfxController(page as unknown as Document, factory, store);
  controllers.push(controller); controller.attach();
  return { controller, engine, factory, store, page, gesture, visibility, listeners };
}

describe('sound effect controller policy', () => {
  it('waits for a trusted gesture and drops all earlier events without a backlog', async () => {
    const { controller, factory, engine, gesture, page } = harness();
    controller.attach();
    expect(page.addEventListener).toHaveBeenCalledTimes(3);
    emitGameSound({ kind: 'star', collected: 1 }); gesture(false);
    expect(factory).not.toHaveBeenCalled();
    let resolve!: (ready: boolean) => void;
    engine.unlock.mockImplementationOnce(() => new Promise<boolean>(done => { resolve = done; }));
    gesture(); gesture();
    emitGameSound({ kind: 'rule' });
    resolve(true); await flush();
    expect(controller.getSnapshot()).toEqual({ enabled: true, status: 'ready' });
    expect(engine.play).not.toHaveBeenCalled();
    emitGameSound({ kind: 'star', collected: 2 });
    expect(engine.play).toHaveBeenCalledExactlyOnceWith({ kind: 'star', collected: 2 });
    expect(engine.unlock).toHaveBeenCalledOnce();
    gesture();
    expect(factory).toHaveBeenCalledOnce();
  });

  it('uses a separate persisted sound preference and cancels immediately when muted', async () => {
    const { controller, engine, factory, store, gesture } = harness('off');
    gesture(); emitGameSound({ kind: 'rule' });
    expect(factory).not.toHaveBeenCalled();
    controller.toggle(true); await flush();
    expect(store.getItem).toHaveBeenCalledWith(sfxPreferenceKey);
    expect(store.setItem).toHaveBeenLastCalledWith('optional-reality:sfx', 'on');
    emitGameSound({ kind: 'spring' });
    controller.toggle(true);
    expect(engine.cancel).toHaveBeenCalledOnce();
    expect(controller.getSnapshot()).toEqual({ enabled: false, status: 'muted' });
    expect(store.setItem).toHaveBeenLastCalledWith('optional-reality:sfx', 'off');
    emitGameSound({ kind: 'star', collected: 3 });
    expect(engine.play).toHaveBeenCalledTimes(1);
  });

  it('cancels hidden-tab sounds and does not replay them after returning', async () => {
    const { controller, gesture, visibility, engine } = harness();
    gesture(); await flush();
    emitGameSound({ kind: 'exit' });
    visibility('hidden');
    expect(engine.cancel).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().status).toBe('waiting');
    emitGameSound({ kind: 'complete' });
    visibility('visible'); await flush();
    expect(controller.getSnapshot().status).toBe('ready');
    expect(engine.play).toHaveBeenCalledTimes(1);
    emitGameSound({ kind: 'rule' });
    expect(engine.play).toHaveBeenCalledTimes(2);
  });

  it.each(['cancel', 'mute', 'hide', 'dispose'] as const)('ignores pending unlock completion after %s', async reason => {
    const { controller, gesture, visibility, engine } = harness();
    let resolve!: (ready: boolean) => void;
    engine.unlock.mockImplementationOnce(() => new Promise<boolean>(done => { resolve = done; }));
    gesture();
    if (reason === 'cancel') emitGameSound({ kind: 'cancel' });
    if (reason === 'mute') controller.toggle();
    if (reason === 'hide') visibility('hidden');
    if (reason === 'dispose') controller.dispose();
    emitGameSound({ kind: 'star', collected: 1 });
    resolve(true); await flush();
    expect(controller.getSnapshot().status).not.toBe('ready');
    expect(engine.play).not.toHaveBeenCalled();
  });

  it('retries refused audio on the next gesture and contains playback exceptions', async () => {
    const { controller, gesture, engine } = harness();
    engine.unlock.mockRejectedValueOnce(new Error('NotAllowedError'));
    gesture(); await flush();
    expect(controller.getSnapshot().status).toBe('blocked');
    gesture(); await flush();
    expect(controller.getSnapshot().status).toBe('ready');
    engine.play.mockImplementationOnce(() => { throw new Error('device lost'); });
    expect(() => emitGameSound({ kind: 'exit' })).not.toThrow();
    expect(controller.getSnapshot().status).toBe('blocked');
    expect(engine.cancel).toHaveBeenCalledOnce();
  });

  it('keeps usable controls with unavailable audio or denied preference storage', async () => {
    const { page } = harness();
    const engine = { unlock: vi.fn().mockRejectedValue(Object.assign(new Error('unavailable'), { name: 'NotSupportedError' })), play: vi.fn(), cancel: vi.fn(), dispose: vi.fn() };
    const store = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    const controller = new SfxController(page as unknown as Document, () => engine, store);
    controllers.push(controller);
    controller.toggle();
    expect(() => controller.toggle(true)).not.toThrow(); await flush();
    expect(controller.getSnapshot().status).toBe('unavailable');
    controller.toggle();
    expect(controller.getSnapshot()).toEqual({ enabled: false, status: 'muted' });
  });

  it('removes subscriptions and disposes one player once when the App is unmounted', async () => {
    const { controller, gesture, engine, listeners } = harness();
    gesture(); await flush();
    controller.dispose(); controller.dispose();
    expect([...listeners.values()].every(set => !set.size)).toBe(true);
    expect(engine.dispose).toHaveBeenCalledOnce();
    emitGameSound({ kind: 'star', collected: 1 });
    expect(engine.play).not.toHaveBeenCalled();
  });
});
