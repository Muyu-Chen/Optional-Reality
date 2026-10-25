// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { levels } from '../levels/catalog';
import { initialTelemetry, type Telemetry } from '../physics/world';
import { GameMenu } from './GameMenu';

afterEach(cleanup);

function showMenu(state: Partial<Telemetry> = {}, level = levels[0]) {
  const callbacks = {
    onChooseLevel: vi.fn(), onResume: vi.fn(), onRetry: vi.fn(),
    onReset: vi.fn(), onReplayTeaching: vi.fn(),
  };
  const props = { level, telemetry: { ...initialTelemetry(level), ...state }, preparing: false, ...callbacks };
  return { ...render(<GameMenu {...props} />), props, ...callbacks };
}

describe('game completion result', () => {
  it('shows actual pickups separately from the overtime-adjusted award', () => {
    showMenu({won:true,overtime:true,stars:{collected:3,total:3}});
    expect(screen.getByRole('status',{name:'Stars 2 of 3'})).toBeTruthy();
    expect(screen.getByText('OVERTIME CLEAR · −1 STAR')).toBeTruthy();
    expect(screen.getByText(/3 collected − 1 overtime star = 2 earned/)).toBeTruthy();
    expect(screen.queryByText('FULL SCORE')).toBeNull();
  });
  it.each([0, 1, 2])('celebrates an ordinary exit with %i stars without awarding full score', collected => {
    const { onChooseLevel, onRetry } = showMenu({ won: true, stars: { collected, total: 3 } });
    expect(screen.getByRole('dialog', { name: 'You found a way.' })).toBeTruthy();
    expect(screen.getByRole('status', { name: `Stars ${collected} of 3` })).toBeTruthy();
    expect(screen.getByText(collected === 0
      ? 'Not a single star? Even a cave dweller from a million years ago could get all three.'
      : 'Exit reached. Collect every star for full score.')).toBeTruthy();
    if (collected > 0) expect(screen.queryByText(/cave dweller/)).toBeNull();
    expect(screen.queryByText('FULL SCORE')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next level →' }));
    expect(onChooseLevel).toHaveBeenCalledExactlyOnceWith(levels[1].id);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('identifies the completed level and awards full score only when every star was collected', () => {
    showMenu({ won: true, stars: { collected: 3, total: 3 } });
    expect(screen.getByRole('dialog', { name: 'Beautifully done.' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Stars 3 of 3' })).toBeTruthy();
    expect(screen.getByText('FULL SCORE')).toBeTruthy();
    expect(screen.getByText('Full score. Every star collected.')).toBeTruthy();
    expect(screen.getByText(levels[0].title, { exact: true })).toBeTruthy();
    expect(screen.queryByText('Exit reached. Collect every star for full score.')).toBeNull();
    expect(screen.queryByText(/cave dweller/)).toBeNull();
  });

  it('offers a working retry instead of a nonexistent next level at the end of the chapter', () => {
    const { onRetry } = showMenu({ won: true, stars: { collected: 3, total: 3 } }, levels.at(-1)!);
    expect(screen.queryByRole('button', { name: 'Next level →' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('keeps preparation blocking Resume and permits resuming once preparation finishes', () => {
    const { props, rerender, onResume } = showMenu({ started: true });
    rerender(<GameMenu {...props} preparing />);
    expect(screen.getByRole('button', { name: 'Resume' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByText(/cave dweller/)).toBeNull();
    rerender(<GameMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('preserves failure recovery without presenting collected stars as a completed level', () => {
    const { onRetry, onReset } = showMenu({ started: true, timedOut: true, fell: true, stars: { collected: 3, total: 3 } });
    expect(screen.getByRole('dialog', { name: 'Out of bounds.' })).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByText('FULL SCORE')).toBeNull();
    expect(screen.queryByText(/cave dweller/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restart & reprepare messages' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
