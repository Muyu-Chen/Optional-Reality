// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { advance, click, lab, rows, startGame } from '../test/game-harness';

describe('geometry chapter queue and retry flow', () => {
  it.each([
    ['multi-bounce',360,'Surface bounce decreased to 0.5.'],
    ['friction-runway',170,'Surface friction increased to 0.3.'],
    ['catch-cup',400,'Cup base bounce decreased to 0.'],
  ] as const)('plays %s with prepared messages and retries without calling AI', async (id,ticks,caption) => {
    const {api}=await startGame(id);
    await click('Load starter messages ↳');
    expect(rows()).toHaveLength(2);expect(api.pending).toHaveLength(0);
    await click('Send now');await advance(ticks);
    expect(lab().world.won).toBe(false);
    await click('Send now');
    expect(screen.getByText(caption)).toBeTruthy();await advance(3600);
    expect(lab().world.won).toBe(true);expect(lab().world.commandCount).toBe(2);
    await act(async()=>fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Try again'})));
    expect(lab().world.tick).toBe(0);expect(lab().world.goal.progress).toBe(0);
    expect(lab().world.started).toBe(false);expect(lab().world.commandCount).toBe(0);
    expect(rows()).toHaveLength(2);expect(rows().every(row=>row.textContent?.includes('Ready'))).toBe(true);
    expect(api.pending).toHaveLength(0);
    expect(screen.getByTestId('time-left').textContent).toBe('30s');
  });
  it('moves through the new levels in sequence using Next level', async () => {
    await startGame('bounce');await click('Load starter messages ↳');await click('Send now');await advance(3600);
    await click('Next level →');expect(lab().world.level.id).toBe('multi-bounce');
    expect(screen.getByText(/You can change:.*Acceleration/)).toBeTruthy();expect(rows()).toHaveLength(0);
  });
});
