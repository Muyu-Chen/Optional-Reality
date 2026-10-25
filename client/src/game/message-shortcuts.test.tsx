// @vitest-environment jsdom
import { act,fireEvent,screen,within } from '@testing-library/react';
import { describe,expect,it } from 'vitest';
import { click,lab,manage,queue,rows,startGame } from '../test/game-harness';

const freeText='Please let the world pull down gently.';
const gravity=[{type:'set_gravity' as const,acceleration:2}];
function write(text:string) {fireEvent.change(screen.getByRole('textbox'),{target:{value:text}});}
async function applyInput(text:string) {
  write(text);
  await act(async()=>fireEvent.keyDown(screen.getByRole('textbox'),{key:'Enter',shiftKey:true}));
}

describe('current-input message shortcuts in StrictMode',()=>{
  it('keeps Enter as prepare-only, and Shift+Enter sends only the current input',async()=>{
    await startGame();
    await queue('Set gravity to 4');
    expect(lab().world.commandCount).toBe(0);
    await applyInput('stop gravity');
    expect(lab().world.gravity).toBe(0);
    expect(lab().world.running).toBe(true);
    expect(lab().world.commandCount).toBe(1);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Set gravity to 4');
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
  });

  it('applies an edited current message without sending its neighbours',async()=>{
    await startGame();await queue('add gravity');await queue('Set gravity to 4');
    await manage();await click('Edit message 2');
    await applyInput('Set gravity to 3');
    expect(lab().world.gravity).toBe(3);expect(lab().world.commandCount).toBe(1);
    expect(rows()).toHaveLength(1);expect(rows()[0].textContent).toContain('add gravity');
  });

  it('does nothing for empty input and does not substitute the next queued message',async()=>{
    await startGame();await queue('add gravity');
    await applyInput('   ');
    expect(lab().world.commandCount).toBe(0);expect(lab().world.started).toBe(false);
    expect(rows()).toHaveLength(1);
  });

  it('consumes a local input once during two immediate key events',async()=>{
    await startGame();write('add gravity');
    await act(async()=>{
      fireEvent.keyDown(screen.getByRole('textbox'),{key:'Enter',shiftKey:true});
      fireEvent.keyDown(screen.getByRole('textbox'),{key:'Enter',shiftKey:true});
    });
    expect(lab().world.commandCount).toBe(1);expect(rows()).toHaveLength(0);
  });

  it.each([{isComposing:true},{keyCode:229}])('ignores both forms of IME confirmation: %j',async composition=>{
    await startGame();write('add gravity');
    for(const shiftKey of [false,true])await act(async()=>fireEvent.keyDown(screen.getByRole('textbox'),{key:'Enter',shiftKey,...composition}));
    expect(rows()).toHaveLength(0);expect(lab().world.commandCount).toBe(0);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('add gravity');
  });

  it('pauses while compiling only the current message, then automatically sends it once',async()=>{
    const {api}=await startGame();await queue('Set gravity to 4');
    await applyInput(freeText);
    expect(api.pending).toHaveLength(1);
    expect(api.pending[0].request.messages.map(message=>message.text)).toEqual([freeText]);
    expect(lab().world.running).toBe(false);expect(lab().world.commandCount).toBe(0);
    await api.complete(0,gravity);
    expect(lab().world.gravity).toBe(2);expect(lab().world.commandCount).toBe(1);
    expect(lab().world.running).toBe(true);expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Set gravity to 4');
    expect(api.pending).toHaveLength(1);
  });

  it('does not submit another input while the immediate message is compiling',async()=>{
    const {api}=await startGame();await applyInput(freeText);await applyInput('add gravity');
    expect(api.pending).toHaveLength(1);expect(rows()).toHaveLength(1);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('add gravity');
    await api.complete(0,gravity);
    expect(lab().world.commandCount).toBe(1);expect(lab().world.gravity).toBe(2);
  });

  it('preserves an editable API failure and never changes the world',async()=>{
    const {api}=await startGame();await applyInput(freeText);
    await api.respond(0,Response.json({error:'Unsupported rule.'},{status:422}));
    expect(lab().world.commandCount).toBe(0);expect(lab().world.started).toBe(false);
    expect(rows()[0].textContent).toContain('Needs editing');
    expect(within(rows()[0]).getByRole('button',{name:'Edit message 1'})).toBeTruthy();
    await click('Edit message 1');expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(freeText);
  });

  it('cancels automatic sending as soon as editing begins, even if the response arrives before Save',async()=>{
    const {api}=await startGame();await applyInput(freeText);
    await manage();await click('Edit message 1');
    await api.complete(0,gravity);
    expect(lab().world.commandCount).toBe(0);expect(lab().world.running).toBe(false);
    expect(rows()[0].textContent).toContain('Ready');
  });

  it.each(['delete','retry','clear','level'] as const)('ignores an immediate response after %s',async action=>{
    const {api}=await startGame();await applyInput(freeText);
    if(action==='delete')await click('Delete message 1');
    else if(action==='retry')await click('Try again');
    else if(action==='clear'){await manage();await click('Clear messages');}
    else {
      await click('Pause menu');fireEvent.click(screen.getByText('Choose a level'));
      await click('01.2 · One More Turn');
    }
    expect(api.pending[0].signal.aborted).toBe(true);
    await api.complete(0,gravity);
    if(action==='retry')await api.complete(1,gravity);
    expect(lab().world.commandCount).toBe(0);expect(lab().world.running).toBe(false);
  });

  it('opens paused settings from the input with Shift+Tab and never toggles back to running',async()=>{
    await startGame();await applyInput('add gravity');
    const event=new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true});
    await act(async()=>fireEvent(screen.getByRole('textbox'),event));
    expect(event.defaultPrevented).toBe(true);expect(lab().world.running).toBe(false);
    expect(screen.getByRole('dialog')).toBeTruthy();
    await act(async()=>fireEvent.keyDown(window,{key:'Tab',shiftKey:true}));
    expect(screen.getByRole('dialog')).toBeTruthy();expect(lab().world.running).toBe(false);
  });

  it('keeps a prepared message pending if Shift+Tab was pressed while waiting for AI',async()=>{
    const {api}=await startGame();await applyInput(freeText);
    await act(async()=>fireEvent.keyDown(screen.getByRole('textbox'),{key:'Tab',shiftKey:true}));
    await api.complete(0,gravity);
    expect(lab().world.commandCount).toBe(0);expect(lab().world.running).toBe(false);
    expect(screen.getByRole('dialog')).toBeTruthy();expect(rows()[0].textContent).toContain('Ready');
  });

  it.each(['won','timedOut','absorbing'] as const)('does not execute the current input after %s',async ending=>{
    await startGame();
    await act(async()=>{
      if(ending==='timedOut')lab().world.timedOut=true;
      else lab().world.won=true;
      lab().report(ending==='absorbing'?'absorbing':'idle');
    });
    await applyInput('add gravity');
    expect(lab().world.commandCount).toBe(0);
  });
});
