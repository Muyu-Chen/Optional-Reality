// @vitest-environment jsdom
import { fireEvent,screen,within } from '@testing-library/react';
import { describe,expect,it } from 'vitest';
import { startGame } from '../test/game-harness';

describe('audio settings stay in the pause menu',()=>{
  it('keeps the playing HUD clear and preserves separate music and effects preferences',async()=>{
    await startGame();
    expect(screen.queryByRole('button',{name:'Turn music off'})).toBeNull();
    fireEvent.keyDown(window,{key:'Tab',shiftKey:true});
    const settings=within(screen.getByRole('dialog',{name:'Paused.'}));
    expect(settings.getByRole('button',{name:'Turn sound effects off'})).toBeTruthy();
    fireEvent.click(settings.getByRole('button',{name:'Turn music off'}));
    expect(localStorage.getItem('optional-reality:music')).toBe('off');
    expect(settings.getByRole('button',{name:'Turn sound effects off'})).toBeTruthy();
    fireEvent.click(settings.getByRole('button',{name:'Back to game'}));
    expect(screen.queryByRole('button',{name:'Turn music on'})).toBeNull();
    fireEvent.keyDown(window,{key:'Tab',shiftKey:true});
    expect(screen.getByRole('button',{name:'Turn music on'})).toBeTruthy();
  });
});
