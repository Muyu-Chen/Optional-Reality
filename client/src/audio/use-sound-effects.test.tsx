// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SoundEffectsControl } from '../components/SoundEffectsControl';
import { SoundEffectsProvider } from './SoundEffectsProvider';
import { emitGameSound } from './game-sound-events';
import { sfxPreferenceKey } from './sfx-controller';

const engine = vi.hoisted(() => ({ create: vi.fn(), unlock: vi.fn().mockResolvedValue(true), play: vi.fn(), cancel: vi.fn(), dispose: vi.fn() }));
vi.mock('./sfx-engine', () => ({ SfxEngine: class {
  constructor() { engine.create(); }
  unlock = engine.unlock;
  play = engine.play;
  cancel = engine.cancel;
  dispose = engine.dispose;
} }));

afterEach(async () => { cleanup();await act(async () => {});localStorage.clear();vi.restoreAllMocks();vi.clearAllMocks(); });

describe('sound effects control lifecycle', () => {
  it('requires a real gesture and retains one optional effects player across level-like remounts', async () => {
    localStorage.setItem('optional-reality:music', 'off');
    const events = vi.spyOn(document, 'addEventListener');
    const view = render(<StrictMode><SoundEffectsProvider><SoundEffectsControl key="first" /></SoundEffectsProvider></StrictMode>);
    expect(engine.create).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Turn sound effects off' }).getAttribute('aria-pressed')).toBe('true');
    const gesture = events.mock.calls.filter(([name]) => name === 'pointerdown').at(-1)![1] as EventListener;
    await act(async () => gesture({ isTrusted: false } as Event));
    expect(engine.create).not.toHaveBeenCalled();
    await act(async () => gesture({ isTrusted: true } as Event));
    expect(engine.create).toHaveBeenCalledOnce();expect(engine.unlock).toHaveBeenCalledOnce();
    emitGameSound({ kind: 'star', collected: 1 });expect(engine.play).toHaveBeenCalledExactlyOnceWith({ kind: 'star', collected: 1 });
    view.rerender(<StrictMode><SoundEffectsProvider><SoundEffectsControl key="next" /></SoundEffectsProvider></StrictMode>);
    expect(engine.create).toHaveBeenCalledOnce();
    expect(engine.dispose).not.toHaveBeenCalled();
    expect(localStorage.getItem('optional-reality:music')).toBe('off');
    view.unmount();expect(engine.dispose).toHaveBeenCalledOnce();
  });

  it('persists an independent opt-out, silences immediately and removes all subscriptions on unmount', async () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const view = render(<SoundEffectsProvider><SoundEffectsControl /></SoundEffectsProvider>);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Turn sound effects off' })));
    expect(localStorage.getItem(sfxPreferenceKey)).toBe('off');
    emitGameSound({ kind: 'complete' });expect(engine.play).not.toHaveBeenCalled();
    view.unmount();
    expect(remove.mock.calls.filter(([name]) => ['pointerdown', 'keydown', 'visibilitychange'].includes(name))).toHaveLength(3);
    render(<SoundEffectsProvider><SoundEffectsControl /></SoundEffectsProvider>);
    expect(screen.getByRole('button', { name: 'Turn sound effects on' }).getAttribute('aria-pressed')).toBe('false');
    expect(engine.create).not.toHaveBeenCalled();
  });
});
