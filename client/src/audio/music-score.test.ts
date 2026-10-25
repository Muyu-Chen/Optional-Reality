import { describe, expect, it } from 'vitest';
import { musicBeatSeconds, notesAtBeat } from './music-score';

describe('original ambient score', () => {
  it('repeats on a bounded 32-beat loop and leaves space between melody notes', () => {
    const loop = Array.from({ length: 32 }, (_, beat) => notesAtBeat(beat));
    expect(notesAtBeat(32)).toEqual(notesAtBeat(0));
    expect(loop.flat().length).toBeLessThan(90);
    expect(loop.some(notes => notes.length === 0)).toBe(true);
    expect(musicBeatSeconds * 32).toBeGreaterThan(20);
    for (const note of loop.flat()) {
      expect(note.pitch).toBeGreaterThanOrEqual(31);
      expect(note.pitch).toBeLessThanOrEqual(79);
      expect(note.gain).toBeLessThanOrEqual(.06);
      expect(note.attack).toBeLessThan(note.duration);
      expect(Number.isFinite(note.duration)).toBe(true);
    }
  });
});
