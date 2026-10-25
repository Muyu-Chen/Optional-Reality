// @vitest-environment jsdom
import { act,fireEvent,screen,within } from '@testing-library/react';
import { describe,expect,it } from 'vitest';
import { advance,click,lab,queue,startGame } from '../test/game-harness';

describe('visible star scoring',()=>{
  it('shows full score, then restores all stars on Try again without preparing messages again',async()=>{
    const {api}=await startGame('bounce');
    expect(screen.getByLabelText('Stars 0 of 3')).toBeTruthy();
    await queue('surface bounce 0');await queue('acceleration upward 2');
    await click('Send now');await advance(370);await click('Send now');await advance(3600);
    expect(lab().world.won).toBe(true);
    expect(screen.getByText('Full score. Every star collected.')).toBeTruthy();
    expect(screen.getAllByLabelText('Stars 3 of 3')).toHaveLength(2);
    await act(async()=>fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Try again'})));
    expect(screen.getByLabelText('Stars 0 of 3')).toBeTruthy();
    expect(screen.queryByText('Full score. Every star collected.')).toBeNull();
    expect(api.pending).toHaveLength(0);
  });
  it('shows ordinary completion even when some stars were missed',async()=>{
    await startGame('bounce');await queue('surface bounce 0.9');await click('Send now');await advance(3600);
    expect(lab().world.won).toBe(true);expect(lab().world.stars.fullScore).toBe(false);
    expect(screen.getByText('Exit reached. Collect every star for full score.')).toBeTruthy();
  });
});
