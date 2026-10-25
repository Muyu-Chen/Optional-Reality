// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Matter from 'matter-js';
import { advance, click, lab, queue, rows, startGame } from '../test/game-harness';
import { PREPARATION_TIMEOUT_MS } from '../api/request-deadline';

const freeText='Please make the world pull down gently.';
const readySend=(index=0)=>within(rows()[index]).getByRole<HTMLButtonElement>('button',{name:'Send now'});
afterEach(()=>vi.useRealTimers());

describe('ready rules remain playable during AI preparation',()=>{
  it('sends ready messages immediately, aborts an old snapshot and does not pause again for unrelated drafts',async()=>{
    const {api}=await startGame();await queue('add gravity');await queue('stop gravity');await queue(freeText);
    expect(api.pending).toHaveLength(1);expect(readySend().disabled).toBe(false);
    await act(async()=>fireEvent.click(readySend()));
    expect(api.pending[0].signal.aborted).toBe(true);expect(lab().world.running).toBe(true);
    expect(lab().world.gravity).toBe(1);expect(lab().world.commandCount).toBe(1);
    await advance(60);expect(lab().world.tick).toBe(60);expect(api.pending).toHaveLength(1);
    expect(screen.getByRole('button',{name:'Prepare'})).toBeTruthy();
    await api.complete(0,[{type:'set_gravity',acceleration:20}]);
    expect(lab().world.gravity).toBe(1);expect(lab().world.running).toBe(true);
    await act(async()=>fireEvent.click(readySend()));
    expect(lab().world.gravity).toBe(0);expect(lab().world.commandCount).toBe(2);
    expect(api.pending).toHaveLength(1);expect(rows()[0].textContent).toContain('Waiting');
  });

  it('lets players cancel a stuck interpretation and explicitly prepare it later',async()=>{
    const {api}=await startGame();await queue('add gravity');await queue(freeText);
    expect(screen.getByText('Reading a message · game paused')).toBeTruthy();
    await click('Cancel');expect(api.pending[0].signal.aborted).toBe(true);
    expect(readySend().disabled).toBe(false);expect(rows()[1].textContent).toContain('Waiting');
    await queue('stop gravity');expect(api.pending).toHaveLength(1);
    await click('Prepare');expect(api.pending).toHaveLength(2);
    await api.complete(0,[{type:'set_gravity',acceleration:20}]);expect(rows()[1].textContent).toContain('Interpreting');
    await api.complete(1,[{type:'set_gravity',acceleration:2}]);
    expect(rows()[1].textContent).toContain('Ready');expect(lab().world.started).toBe(false);
    await act(async()=>fireEvent.click(readySend(1)));expect(lab().world.gravity).toBe(2);
  });

  it('recovers after a request never answers and does not consume simulation time',async()=>{
    vi.useFakeTimers();const {api}=await startGame();await queue('add gravity');await queue(freeText);
    await act(async()=>vi.advanceTimersByTimeAsync(PREPARATION_TIMEOUT_MS));
    expect(rows()[1].textContent).toContain('AI took too long');expect(rows()[1].textContent).toContain('Needs editing');
    expect(api.pending[0].signal.aborted).toBe(true);expect(readySend().disabled).toBe(false);
    expect(lab().world.tick).toBe(0);expect(lab().world.timedOut).toBe(false);
    await act(async()=>fireEvent.click(readySend()));await advance(120);
    expect(lab().world.running).toBe(true);expect(lab().world.tick).toBe(120);expect(api.pending).toHaveLength(1);
    await api.complete(0,[{type:'set_gravity',acceleration:-20}]);expect(lab().world.gravity).toBe(1);
  });

  it('shows an explicit out-of-bounds result and restores ready messages on retry',async()=>{
    await startGame();await queue('stop gravity');await queue('add gravity');await click('Send now');
    await act(async()=>{
      const world=lab().world;
      Matter.Body.setPosition(world.ball,{x:world.level.viewport.width+world.level.ball.radius+1,y:50});world.step();lab().report();
    });
    const dialog=screen.getByRole('dialog',{name:'Out of bounds.'});
    expect(dialog.closest('.stage-overlay--ended')).toBeTruthy();
    expect(lab().world.outOfBounds).toBe('right');expect(readySend().disabled).toBe(true);
    await act(async()=>fireEvent.click(within(dialog).getByRole('button',{name:'Try again'})));
    expect(screen.queryByRole('dialog')).toBeNull();expect(lab().world.outOfBounds).toBeNull();
    expect(readySend().disabled).toBe(false);expect(rows()).toHaveLength(2);expect(lab().world.tick).toBe(0);
    await click('Send now');expect(lab().world.running).toBe(true);
  });
});
