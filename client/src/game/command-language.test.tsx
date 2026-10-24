// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { advance, button, click, lab, queue, rows, startGame } from '../test/game-harness';

describe('reviewable command corrections', () => {
  it('limits fan power before Send now, keeps the requested value visible and preserves feedback on undo/retry', async () => {
    const {api}=await startGame('breeze');
    await queue('Set fan power to 10');
    expect(api.pending).toHaveLength(0);
    expect(rows()[0].textContent).toContain('Requested 10 → limited to 2');
    expect(lab().world.rules.values['fan-main'].fan_power).toBe(0);
    await click('Send now');expect(lab().world.rules.values['fan-main'].fan_power).toBe(2);
    await click('Manage');await click('Undo last rule');
    expect(lab().world.rules.values['fan-main'].fan_power).toBe(0);
    expect(rows()[0].textContent).toContain('Requested 10 → limited to 2');
    await click('Try again');expect(rows()[0].textContent).toContain('Requested 10 → limited to 2');
    expect(api.pending).toHaveLength(0);
  });
  it('also bounds an unbounded response from an older API before showing Ready', async () => {
    const {api}=await startGame('breeze');
    await queue('Please turn the blower up very high.');
    await api.complete(0,[{type:'set_property',target:'fan-main',property:'fan_power',value:10}]);
    expect(rows()[0].textContent).toContain('Requested 10 → limited to 2');
    expect(lab().world.rules.values['fan-main'].fan_power).toBe(0);
    await click('Send now');expect(lab().world.rules.values['fan-main'].fan_power).toBe(2);
  });
  it('queues a corrected acceleration locally, then applies once and restores it on Try again', async () => {
    const {api}=await startGame();
    await queue('add acceleration right word');
    expect(api.pending).toHaveLength(0);
    expect(rows()[0].textContent).toContain('Understood as: add acceleration rightward');
    expect(lab().world.engine.gravity.x).toBe(0);expect(lab().world.started).toBe(false);
    await click('Send now');await advance(30);
    expect(lab().world.engine.gravity.x).toBe(1);expect(lab().world.commandCount).toBe(1);
    expect(screen.getByText('Acceleration now pulls right at 1 m/s².')).toBeTruthy();
    await click('Try again');
    expect(lab().world.engine.gravity.x).toBe(0);expect(lab().world.tick).toBe(0);
    expect(rows()[0].textContent).toContain('Understood as: add acceleration rightward');
    expect(button('Send now').disabled).toBe(false);expect(api.pending).toHaveLength(0);
  });
  it('keeps a model correction for review and drops it after editing', async () => {
    const {api}=await startGame();
    await queue('Please make the pull gentle in that direction.');
    const request=api.pending[0].request;
    await api.respond(0,Response.json({...request,rules:undefined,messages:[{id:request.messages[0].id,operations:[{type:'set_gravity',acceleration:1}],understoodAs:'Add gentle downward gravity.'}]}));
    expect(rows()[0].textContent).toContain('Understood as: Add gentle downward gravity.');
    await click('Manage');await click('Edit message 1');
    fireEvent.change(screen.getByRole('textbox'),{target:{value:'stop gravity'}});
    await click('Save ↳');expect(rows()[0].textContent).not.toContain('Understood as:');
  });
});
