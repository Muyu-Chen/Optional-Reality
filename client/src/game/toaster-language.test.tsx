// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { startGame,queue,rows,click,lab } from '../test/game-harness';

describe('toaster wording through the real queue and world',()=>{
  it('prepares both original phrases without AI, then changes only device strength when sent',async()=>{
    const {api}=await startGame('toaster');
    const materials=structuredClone(lab().world.rules.values.world);
    await queue('toaster增加弹性');await queue('toaster增加弹力');
    expect(api.pending).toHaveLength(0);expect(rows()).toHaveLength(2);
    for(const row of rows())expect(row.textContent).toContain('Spring strength + 1');
    expect(lab().world.started).toBe(false);expect(lab().world.rules.values['spring-main'].spring_power).toBe(0);
    await click('Send now');expect(lab().world.rules.values['spring-main'].spring_power).toBe(1);
    await click('Send now');expect(lab().world.rules.values['spring-main'].spring_power).toBe(2);
    expect(lab().world.rules.values.world).toEqual(materials);expect(lab().world.commandCount).toBe(2);
    await click('Try again');expect(lab().world.rules.values['spring-main'].spring_power).toBe(0);
    await click('Send now');expect(lab().world.rules.values['spring-main'].spring_power).toBe(1);
    expect(api.pending).toHaveLength(0);
  });
});
