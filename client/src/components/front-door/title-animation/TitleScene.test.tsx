// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TitleScene } from './TitleScene';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('layered title animation lifecycle', () => {
  it('renders a static complete illustration for reduced motion and cleans up its listener', () => {
    const remove = vi.fn(), add = vi.fn();
    vi.stubGlobal('matchMedia', () => ({matches:true,addEventListener:add,removeEventListener:remove}));
    let draw: FrameRequestCallback | undefined;
    const request = vi.fn((callback: FrameRequestCallback) => { draw = callback; return 7; });
    const cancel = vi.fn();vi.stubGlobal('requestAnimationFrame',request);vi.stubGlobal('cancelAnimationFrame',cancel);
    const view = render(<TitleScene />);
    act(() => draw?.(100));
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('img', {name:/collecting three stars/})).toBeTruthy();
    expect(view.container.querySelectorAll('image')).toHaveLength(10);
    expect(view.container.querySelector('canvas')).toBeNull();
    view.unmount();
    expect(cancel).toHaveBeenCalledWith(7);
    expect(remove).toHaveBeenCalledWith('change',add.mock.calls[0][1]);
  });
});
