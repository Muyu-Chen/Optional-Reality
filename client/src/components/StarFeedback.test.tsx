// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StarProgress } from './StarProgress';
import { ResultStars } from './ResultStars';

afterEach(cleanup);

const hudContent = () => screen.getByRole('status').querySelector('.star-progress-content')!;
const celebrating = () => hudContent().classList.contains('star-progress-content--pickup');

describe('star pickup feedback', () => {
  it('shows the real score without celebrating a component mounted with existing progress', () => {
    render(<StarProgress collected={2} total={3} />);
    expect(screen.getByRole('status', { name: 'Stars 2 of 3' })).toBeTruthy();
    expect(celebrating()).toBe(false);
  });

  it('emphasizes a new pickup once and does not replay it for unchanged progress', () => {
    const view = render(<StarProgress collected={0} total={3} />);
    expect(celebrating()).toBe(false);
    view.rerender(<StarProgress collected={1} total={3} />);
    expect(celebrating()).toBe(true);
    const pickup = hudContent();
    view.rerender(<StarProgress collected={1} total={3} />);
    expect(hudContent()).toBe(pickup);
    expect(screen.getByRole('status', { name: 'Stars 1 of 3' })).toBeTruthy();
    view.rerender(<StarProgress collected={2} total={3} />);
    expect(hudContent()).not.toBe(pickup);
    expect(celebrating()).toBe(true);
  });

  it('clears celebration when retry restores stars and can emphasize a later real pickup', () => {
    const view = render(<StarProgress collected={0} total={3} />);
    view.rerender(<StarProgress collected={3} total={3} />);
    expect(celebrating()).toBe(true);
    view.rerender(<StarProgress collected={0} total={3} />);
    expect(screen.getByRole('status', { name: 'Stars 0 of 3' })).toBeTruthy();
    expect(celebrating()).toBe(false);
    view.rerender(<StarProgress collected={1} total={3} />);
    expect(celebrating()).toBe(true);
  });

  it('does not mistake a changed star total or an empty scene for a pickup', () => {
    const view = render(<StarProgress collected={0} total={0} />);
    expect(screen.queryByRole('status')).toBeNull();
    view.rerender(<StarProgress collected={2} total={4} />);
    expect(screen.getByRole('status', { name: 'Stars 2 of 4' })).toBeTruthy();
    expect(celebrating()).toBe(false);
    view.rerender(<StarProgress collected={1} total={3} />);
    expect(celebrating()).toBe(false);
  });
});

describe('earned result stars', () => {
  it.each([0, 1, 2, 3])('leaves all missed stars static when %i of three were collected', collected => {
    const { container } = render(<ResultStars collected={collected} total={3} />);
    expect(screen.getByRole('status', { name: `Stars ${collected} of 3` })).toBeTruthy();
    expect(container.querySelectorAll('.result-star')).toHaveLength(3);
    expect(container.querySelectorAll('.result-star--collected')).toHaveLength(collected);
    expect(container.querySelectorAll('.result-star-sweep')).toHaveLength(collected);
    for (const missed of container.querySelectorAll('.result-star:not(.result-star--collected)')) {
      expect(missed.querySelector('.result-star-sweep')).toBeNull();
      expect(missed.querySelector('.result-star-shine')).toBeNull();
    }
  });

  it('keeps SVG clipping identifiers distinct when more than one result is rendered', () => {
    const { container } = render(<><ResultStars collected={3} total={3} /><ResultStars collected={3} total={3} /></>);
    const masks = [...container.querySelectorAll('clipPath')].map(mask => mask.id);
    expect(masks).toHaveLength(6);
    expect(new Set(masks).size).toBe(6);
  });
});
