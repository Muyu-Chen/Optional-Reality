// @vitest-environment jsdom
import Matter from 'matter-js';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { startGame, queue, click, advance, lab } from '../test/game-harness';
import { loadJourney } from './journey-progress';

describe('overtime game flow',()=>{
  it('keeps sending available, restarts the clock and saves the reduced award',async()=>{
    await startGame();await queue('stop gravity');await click('Send now');
    lab().world.tick=3599;await advance(1);
    expect(screen.getByTestId('time-left').textContent).toBe('30s');
    expect(screen.getByText('OVERTIME · walls active · −1 star')).toBeTruthy();
    await queue('Give the ball a gentle upward acceleration.');await click('Send now');
    expect(lab().world.rules.acceleration.y).toBe(-.5);
    for(const star of lab().world.level.stars!)lab().world.stars.collected.add(star.id);
    const exit=lab().world.level.exit;
    Matter.Body.setPosition(lab().world.ball,{x:exit.x+10,y:exit.y+10});
    await advance(1);
    expect(screen.getByText('OVERTIME CLEAR · −1 STAR')).toBeTruthy();
    expect(loadJourney().completed['gravity-lab']).toBe(2);
    await act(async()=>fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Try again'})));
    expect(lab().world.overtime).toBe(false);
    expect(screen.getByTestId('time-left').textContent).toBe('30s');
    expect(screen.queryByText('OVERTIME · walls active · −1 star')).toBeNull();
  });
});
