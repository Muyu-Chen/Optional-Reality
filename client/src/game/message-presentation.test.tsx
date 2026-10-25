// @vitest-environment jsdom
import { fireEvent,screen,within } from '@testing-library/react';
import { describe,expect,it } from 'vitest';
import { queue,rows,startGame } from '../test/game-harness';

describe('compact rule cards',()=>{
  it('keeps three readable summaries, operations and per-message actions available without Manage',async()=>{
    await startGame();
    const shortcuts=document.querySelector('.composer-shortcuts')!;
    expect([...shortcuts.children].map(line=>line.textContent)).toEqual(['Enter queue','Shift+Enter apply now']);
    for(const text of ['set surface bounce to 0.1','add acceleration upward of 1','stop gravity'])await queue(text);
    expect(rows()).toHaveLength(3);
    for(const [i,row] of rows().entries()) {
      expect(within(row).getByRole('button',{name:'Send now'})).toBeTruthy();
      expect(within(row).getByRole('button',{name:`Delete message ${i+1}`})).toBeTruthy();
      expect(row.querySelector('details')?.open).toBe(false);
      expect(row.querySelector('.rule-preview')?.textContent).toBeTruthy();
      expect(row.querySelector('.message-text')?.getAttribute('title')).toBeTruthy();
    }
  });

  it('uses the prepared rule for direction and material cues, preserving full text behind an accessible expansion',async()=>{
    await startGame();
    await queue('add acceleration upward of 1');
    await queue('set surface bounce to 0.9');
    await queue('set surface friction to 0.5');
    expect(rows()[0].querySelector('.rule-preview--acceleration .rule-preview-icon')?.textContent).toBe('↑');
    expect(rows()[1].querySelector('.rule-preview--bounce')).toBeTruthy();
    expect(rows()[2].querySelector('.rule-preview--friction')).toBeTruthy();
    fireEvent.click(within(rows()[0]).getByLabelText('Details for message 1'));
    expect(rows()[0].querySelector('details')?.open).toBe(true);
    expect(rows()[0].querySelector('.message-full-text')?.textContent).toBe('add acceleration upward of 1');
    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
