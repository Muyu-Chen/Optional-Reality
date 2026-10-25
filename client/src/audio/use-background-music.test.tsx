// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MusicControl } from '../components/MusicControl';
import { MusicProvider } from './MusicProvider';

const { attach, dispose, pause, play } = vi.hoisted(() => ({
  attach: vi.fn(), dispose: vi.fn(), pause: vi.fn(), play: vi.fn().mockResolvedValue(true),
}));

vi.mock('./music-engine', () => ({ MusicEngine: class {
  constructor() { attach(); }
  play = play;
  pause = pause;
  dispose = dispose;
} }));

afterEach(async () => { cleanup(); await act(async () => {}); localStorage.clear(); vi.clearAllMocks(); });

describe('music control mount lifecycle', () => {
  it('survives StrictMode and level-key remounts without multiplying players', async () => {
    localStorage.setItem('optional-reality:music', 'off');
    const add = vi.spyOn(document, 'addEventListener');
    const view = render(<StrictMode><MusicProvider><MusicControl key="first" /></MusicProvider></StrictMode>);
    expect(attach).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Turn music on' })));
    // Synthetic clicks toggle the preference but cannot bypass browser gesture policy.
    expect(attach).not.toHaveBeenCalled();
    const gesture = add.mock.calls.filter(([name]) => name === 'pointerdown').at(-1)![1] as EventListener;
    await act(async () => gesture({ isTrusted: true } as Event));
    expect(attach).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
    // Even a split update with no mounted Game between levels keeps audio alive.
    view.rerender(<StrictMode><MusicProvider>{null}</MusicProvider></StrictMode>);
    await act(async () => {});
    expect(dispose).not.toHaveBeenCalled();
    view.rerender(<StrictMode><MusicProvider><MusicControl key="second" /></MusicProvider></StrictMode>);
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Turn music off' }).getAttribute('aria-pressed')).toBe('true');
    expect(dispose).not.toHaveBeenCalled();
    await act(async () => gesture({ isTrusted: true } as Event));
    expect(play).toHaveBeenCalledOnce();
    expect(attach).toHaveBeenCalledOnce();
    view.unmount();
    await act(async () => {});
    expect(dispose).toHaveBeenCalledOnce();
    add.mockRestore();
  });

  it('cleans document subscriptions and reads the saved preference on a fresh visit', async () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const view = render(<MusicProvider><MusicControl /></MusicProvider>);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Turn music off' })));
    expect(localStorage.getItem('optional-reality:music')).toBe('off');
    view.unmount();
    await act(async () => {});
    expect(remove.mock.calls.filter(([name]) => ['pointerdown', 'keydown', 'visibilitychange'].includes(name))).toHaveLength(3);
    remove.mockRestore();
    render(<MusicProvider><MusicControl /></MusicProvider>);
    expect(screen.getByRole('button', { name: 'Turn music on' }).getAttribute('aria-pressed')).toBe('false');
  });
});
