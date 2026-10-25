// @vitest-environment jsdom
import {screen} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {startGame,click,rows,lab,advance} from '../test/game-harness';
import {levels} from '../levels/catalog';
import {levelLabel} from '../levels/progression';
import {loadJourney} from './journey-progress';

describe('Bank Shot as the first collision lesson',()=>{
  it('precedes the elastic floor, keeps its stable ID, and prepares a simple first-visit rule',async()=>{
    const collisions=levels.filter(level=>level.number===2);
    expect(collisions.slice(0,5).map(level=>level.id)).toEqual(['bank-shot','bounce','multi-bounce','friction-runway','catch-cup']);
    expect(collisions.slice(0,5).map(levelLabel)).toEqual(['02.1','02.2','02.3','02.4','02.5']);
    const {api}=await startGame('bank-shot',undefined,null,true);
    expect(screen.getByRole('dialog').textContent).toContain('Blue means bounce.');
    expect(lab().world.started).toBe(false);expect(lab().world.rules.acceleration).toEqual({x:0,y:0});
    await click("Let's play");expect(rows()[0].textContent).toContain('Set surface bounce to 1');
    await click('Send now');await advance(3600);
    expect(lab().world.won).toBe(true);expect(lab().world.stars.fullScore).toBe(true);
    expect(loadJourney().completed['bank-shot']).toBe(3);expect(api.pending).toHaveLength(0);
    await click('Next level →');expect(lab().world.level.id).toBe('bounce');
  });
});
