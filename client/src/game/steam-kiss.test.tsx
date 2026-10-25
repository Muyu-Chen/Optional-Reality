// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SteamKissExperiment } from './SteamKissExperiment';

vi.mock('../../experiments/steam-kiss/renderer.js', () => ({
  createRenderer: () => ({ draw: vi.fn(), update: vi.fn(), reset: vi.fn() }),
}));
let frame: FrameRequestCallback;
let timestamp = 0;
beforeEach(() => {
  timestamp = 0;
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('requestAnimationFrame', (next: FrameRequestCallback) => { frame = next; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function advance(seconds: number) {
  act(() => { for (let i = 0; i < Math.ceil(seconds * 120); i++) { timestamp += 1000 / 120; frame(timestamp); } });
}
function apply(text: string) {
  fireEvent.change(screen.getByLabelText('环境规则'), { target: { value: text } });
  fireEvent.submit(document.querySelector('#rule-form')!);
}
describe('single-level Steam experiment controls', () => {
  it('recipes only fill input, application changes rules, reset restores initial rules', () => {
    render(<SteamKissExperiment onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /让道路变滑/ }));
    expect((screen.getByLabelText('环境规则') as HTMLInputElement).value).toBe('Set road friction to 0.05');
    expect(document.querySelector('#friction')!.textContent).toBe('0.70');
    fireEvent.submit(document.querySelector('#rule-form')!);
    expect(document.querySelector('#friction')!.textContent).toBe('0.05');
    fireEvent.click(screen.getByRole('button', { name: '恢复初始规则' }));
    expect(document.querySelector('#friction')!.textContent).toBe('0.70');
  });
  it('default run collides, paused frames freeze, retry retains rules and clears the result', () => {
    render(<SteamKissExperiment onBack={vi.fn()} />);
    apply('Set collision elasticity to 0.85');
    fireEvent.click(screen.getByRole('button', { name: /发车/ }));
    advance(1);
    fireEvent.click(screen.getByRole('button', { name: /暂停 Ⅱ/ }));
    const time = document.querySelector('#time')!.textContent;
    advance(1); expect(document.querySelector('#time')!.textContent).toBe(time);
    fireEvent.click(screen.getByRole('button', { name: /继续 ↗/ }));
    advance(8);
    expect(screen.getByRole('heading', { name: '这一次，吻得太重。' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '同样的规则，再试一次 ↗' }));
    expect(document.querySelector('#result')!.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('#bounce')!.textContent).toBe('0.85');
    expect(document.querySelector('#time')!.textContent).toBe('00.00 s');
  });
  it('slow observation changes elapsed simulation time and leaving cleans up the loop', () => {
    const back = vi.fn(), { unmount } = render(<SteamKissExperiment onBack={back} />);
    fireEvent.click(screen.getByRole('button', { name: '慢放 ×0.35' }));
    fireEvent.click(screen.getByRole('button', { name: /发车/ }));
    advance(2);
    expect(Number.parseFloat(document.querySelector('#time')!.textContent!)).toBeCloseTo(.7, 1);
    fireEvent.click(screen.getByRole('link', { name: '返回选关' }));expect(back).toHaveBeenCalledOnce();
    unmount();expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
