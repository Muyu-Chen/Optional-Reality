// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { advance, click, ControlledApi, lab, queue, startGame } from '../test/game-harness';

const briefing = () => screen.queryByRole('status', { name: 'Initial state' });
const wait = async (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup();vi.useRealTimers(); });

describe('five-second initial state briefing with a reversible fade', () => {
  it('shows the untouched world for five seconds, then fades without starting the simulation', async () => {
    await startGame();
    expect(briefing()?.textContent).toContain('At rest');
    expect(briefing()?.textContent).toContain('None · 0 m/s²');
    await wait(4999);expect(briefing()).toBeTruthy();expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(false);
    await wait(1);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    await wait(399);expect(briefing()).toBeTruthy();await wait(1);expect(briefing()).toBeNull();
    expect(lab().world.tick).toBe(0);expect(lab().world.started).toBe(false);
    expect(screen.getByTestId('time-left').textContent).toBe('30s');
  });
  it('waits until the first-visit tutorial has closed', async () => {
    await startGame('gravity-lab', new ControlledApi(), [], true);
    expect(briefing()).toBeNull();await wait(10000);
    await click("Let's play");expect(briefing()).toBeTruthy();
    await wait(4999);expect(briefing()).toBeTruthy();
    await wait(1);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    await wait(400);expect(briefing()).toBeNull();expect(lab().world.started).toBe(false);
  });
  it('does not spend its visible time behind the pause menu or in a background tab', async () => {
    await startGame('multi-bounce');await wait(1000);
    await click('Pause menu');await wait(6000);expect(briefing()).toBeNull();
    await click('Back to game');expect(briefing()).toBeTruthy();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));await wait(6000);
    expect(briefing()).toBeNull();hidden.mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    await wait(3999);expect(briefing()).toBeTruthy();
    await wait(1);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    await wait(400);expect(briefing()).toBeNull();
  });
  it('allows preparing messages without changing the displayed initial state, and clears on successful send', async () => {
    await startGame('bounce');await queue('Set surface bounce to 0.9');
    expect(briefing()?.textContent).toContain('bounce 0.1');
    expect(lab().world.rules.values.world.restitution).toBe(.1);
    await click('Send now');expect(briefing()).toBeNull();
    expect(lab().world.running).toBe(true);await advance(30);
    await click('Pause menu');await click('Resume');expect(briefing()).toBeNull();
  });
  it('reappears with original values on retry and resets its own timer', async () => {
    await startGame('bounce');await queue('Set surface bounce to 0.9');await click('Send now');
    await advance(40);await click('Try again');
    expect(briefing()?.textContent).toContain('bounce 0.1');
    expect(lab().world.tick).toBe(0);expect(lab().world.started).toBe(false);
    await wait(2000);await click('Try again');await wait(4999);expect(briefing()).toBeTruthy();
    await wait(1);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    await wait(400);expect(briefing()).toBeNull();
  });
  it('can be dismissed without moving keyboard focus or changing the world', async () => {
    await startGame('multi-bounce');const input = screen.getByRole('textbox');input.focus();
    expect(document.activeElement).toBe(input);await click('Dismiss initial state');
    expect(briefing()).toBeNull();expect(lab().world.started).toBe(false);
  });
  it('cancels the previous timer when changing levels and when unmounted', async () => {
    const view = await startGame('multi-bounce');await wait(2000);
    await click('Pause menu');fireEvent.click(screen.getByText('Choose a level'));
    await click('02.3 · Brake Before the Edge');
    expect(briefing()?.textContent).toContain('Block');
    await wait(4999);expect(briefing()).toBeTruthy();await wait(1);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    await wait(400);expect(briefing()).toBeNull();
    view.unmount();expect(vi.getTimerCount()).toBe(0);
  });
  it('holds on hover, restores a fading card on re-entry, and grants five new seconds after leaving',async()=>{
    await startGame();await wait(4900);fireEvent.mouseEnter(briefing()!);
    await wait(10000);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(false);
    fireEvent.mouseLeave(briefing()!);await wait(4999);
    expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(false);
    await wait(1);await wait(200);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    fireEvent.mouseEnter(briefing()!);await wait(10000);
    expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(false);
    fireEvent.mouseLeave(briefing()!);await wait(5000);await wait(400);expect(briefing()).toBeNull();
    expect(lab().world.tick).toBe(0);
  });
  it('holds keyboard focus and still permits immediate manual dismissal',async()=>{
    await startGame();const close=screen.getByRole('button',{name:'Dismiss initial state'});
    fireEvent.focus(close);await wait(10000);expect(briefing()).toBeTruthy();
    fireEvent.blur(close,{relatedTarget:screen.getByRole('textbox')});await wait(5000);
    expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    await click('Dismiss initial state');expect(briefing()).toBeNull();expect(lab().world.started).toBe(false);
  });
  it('cleans a pending fade on retry and does not keep hover from a hidden card',async()=>{
    await startGame();await wait(5000);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(true);
    await click('Try again');await wait(400);expect(briefing()?.classList.contains('initial-briefing--fading')).toBe(false);
    fireEvent.mouseEnter(briefing()!);await click('Pause menu');await wait(10000);
    await click('Back to game');await wait(5000);await wait(400);expect(briefing()).toBeNull();
  });
  it('respects reduced motion while preserving the full five-second reading time',async()=>{
    vi.stubGlobal('matchMedia',(query:string)=>({matches:query==='(prefers-reduced-motion: reduce)',addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    await startGame();await wait(4999);expect(briefing()).toBeTruthy();
    await wait(1);expect(briefing()).toBeNull();
  });
});
