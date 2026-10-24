// @vitest-environment jsdom
import { useCallback, useState } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RuleCaption, type Caption } from './RuleCaption';

function Captions({ initial }: { initial: Caption[] }) {
  const [captions, setCaptions] = useState(initial);
  const finish = useCallback((id: string) => setCaptions(items => items.filter(item => item.id !== id)), []);
  return <RuleCaption captions={captions} finish={finish} />;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
const caption = (id: string, group = id): Caption => ({ id, group, lines: [id] });

describe('caption lifecycle', () => {
  it('shows batch captions sequentially for five seconds each', () => {
    render(<Captions initial={[caption('first', 'batch'), caption('second', 'batch')]} />);
    expect(screen.queryByText('second')).toBeNull();
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByText('first')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('first')).toBeNull();
    expect(screen.getByText('second')).toBeTruthy();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText('second')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not restart the existing timer when a new manual caption arrives', () => {
    const finish = vi.fn();
    const view = render(<RuleCaption captions={[caption('first')]} finish={finish} />);
    act(() => vi.advanceTimersByTime(4000));
    view.rerender(<RuleCaption captions={[caption('first'), caption('new')]} finish={finish} />);
    expect(screen.getAllByRole('status')).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1000));
    expect(finish.mock.calls).toEqual([['first']]);
    act(() => vi.advanceTimersByTime(4000));
    expect(finish.mock.calls).toEqual([['first'], ['new']]);
  });

  it('limits visible groups to three and clears timers on unmount', () => {
    const finish = vi.fn();
    const view = render(<RuleCaption captions={['a', 'b', 'c', 'd'].map(id => caption(id))} finish={finish} />);
    expect(screen.getAllByRole('status')).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(4);
    view.unmount();
    act(() => vi.advanceTimersByTime(10000));
    expect(finish).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
