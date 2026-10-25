// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCELERATION_HIGHLIGHT_MS, AccelerationIndicator } from './AccelerationIndicator';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup();vi.useRealTimers(); });
const active = () => !!screen.getByRole('status').querySelector('.acceleration-indicator-content--changed');

describe('acceleration change feedback', () => {
  it('shows the initial value without flashing or scheduling a timer', () => {
    render(<AccelerationIndicator acceleration={{ x: 0, y: 2 }} />);
    expect(screen.getByRole('status', { name: 'Acceleration: 2 meters per second squared, downward.' })).toBeTruthy();
    expect(screen.getByText('m/s²')).toBeTruthy();expect(active()).toBe(false);expect(vi.getTimerCount()).toBe(0);
  });

  it('highlights a real change once and does not restart for routine telemetry refreshes', () => {
    const view = render(<AccelerationIndicator acceleration={{ x: 0, y: 0 }} />);
    view.rerender(<AccelerationIndicator acceleration={{ x: 0, y: 2 }} />);
    expect(active()).toBe(true);expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(ACCELERATION_HIGHLIGHT_MS - 10));
    view.rerender(<AccelerationIndicator acceleration={{ x: 0, y: 2 }} />);
    act(() => vi.advanceTimersByTime(10));
    expect(active()).toBe(false);expect(vi.getTimerCount()).toBe(0);
  });

  it('restarts a short highlight for a newer result while cancelling the old timer', () => {
    const view = render(<AccelerationIndicator acceleration={{ x: 0, y: 0 }} />);
    view.rerender(<AccelerationIndicator acceleration={{ x: 0, y: 2 }} />);
    act(() => vi.advanceTimersByTime(300));
    view.rerender(<AccelerationIndicator acceleration={{ x: 0, y: -4 }} />);
    expect(screen.getByRole('status', { name: 'Acceleration: 4 meters per second squared, upward.' })).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(300));expect(active()).toBe(true);
    act(() => vi.advanceTimersByTime(300));expect(active()).toBe(false);
  });

  it('does not flash for binary roundoff but does for a reversal and a real reset to zero', () => {
    const view = render(<AccelerationIndicator acceleration={{ x: .3, y: 0 }} />);
    view.rerender(<AccelerationIndicator acceleration={{ x: .1 + .2, y: 0 }} />);
    expect(active()).toBe(false);expect(vi.getTimerCount()).toBe(0);
    view.rerender(<AccelerationIndicator acceleration={{ x: -.3, y: 0 }} />);expect(active()).toBe(true);
    act(() => vi.advanceTimersByTime(ACCELERATION_HIGHLIGHT_MS));
    view.rerender(<AccelerationIndicator acceleration={{ x: 0, y: 0 }} />);
    expect(screen.getByRole('status', { name: 'Acceleration: zero, 0 meters per second squared.' })).toBeTruthy();
    expect(active()).toBe(true);
  });

  it('removes an unfinished highlight timer when the level unmounts', () => {
    const view = render(<AccelerationIndicator acceleration={{ x: 0, y: 0 }} />);
    view.rerender(<AccelerationIndicator acceleration={{ x: 3, y: 4 }} />);expect(vi.getTimerCount()).toBe(1);
    view.unmount();expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(ACCELERATION_HIGHLIGHT_MS));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
