// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { advance, button, click, lab, queue, rows, startGame } from '../test/game-harness';

describe('explicit Start button',()=>{
  it('starts the timer in zero acceleration without inventing a rule or spending a message',async()=>{
    await startGame();
    const before=structuredClone(lab().world.rules),position={...lab().world.ball.position};
    await click('Start game');await advance(120);
    expect(lab().world.snapshot()).toMatchObject({started:true,running:true,tick:120});
    expect(screen.getByTestId('time-left').textContent).toBe('29s');
    expect(lab().world.ball.position).toEqual(position);
    expect(lab().world.rules).toEqual(before);expect(lab().world.commandCount).toBe(0);
    expect(rows()).toHaveLength(0);expect(screen.queryByRole('button',{name:'Start game'})).toBeNull();
    expect(screen.queryByRole('status',{name:'Initial state'})).toBeNull();
  });
  it('runs the initial physics while preserving ready messages until they are sent',async()=>{
    await startGame('bounce');await queue('Set surface bounce to 0.9');
    const initialBounce=lab().world.rules.values.world.restitution,y=lab().world.ball.position.y;
    const start=button('Start game');
    await act(()=>{fireEvent.click(start);fireEvent.click(start);});await advance(120);
    expect(lab().world.ball.position.y).toBeGreaterThan(y);
    expect(lab().world.rules.values.world.restitution).toBe(initialBounce);
    expect(lab().world.commandCount).toBe(0);expect(rows()[0].textContent).toContain('Ready');
    await click('Send now');expect(lab().world.rules.values.world.restitution).toBe(.9);
    expect(lab().world.commandCount).toBe(1);expect(lab().world.tick).toBe(120);
  });
  it('blocks Start during AI preparation and restores it after cancellation',async()=>{
    await startGame();await queue('Please make the downward pull gentle.');
    expect(button('Start game').disabled).toBe(true);
    await click('Start game');await advance(120);expect(lab().world.started).toBe(false);
    await click('Cancel');expect(button('Start game').disabled).toBe(false);
    await click('Start game');expect(lab().world.running).toBe(true);
  });
  it('keeps tutorial and settings pauses intact, then restores Start after retry',async()=>{
    await startGame('gravity-lab',undefined,[],true);
    const start=button('Start game');await act(()=>fireEvent.click(start));
    expect(lab().world.started).toBe(false);
    await click("Let's play");await click('Pause menu');
    expect(button('Start game').disabled).toBe(true);
    await click('Back to game');expect(lab().world.started).toBe(false);
    await click('Start game');await advance(120);
    await click('Pause menu');await advance(120);expect(lab().world.tick).toBe(120);
    await click('Resume');await advance(120);expect(lab().world.tick).toBe(240);
    await click('Try again');expect(button('Start game').disabled).toBe(false);
    expect(lab().world.snapshot()).toMatchObject({started:false,running:false,tick:0});
  });
});
