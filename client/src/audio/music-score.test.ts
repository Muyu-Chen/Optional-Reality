import { describe, expect, it } from 'vitest';
import { musicBeatSeconds, notesAtBeat } from './music-score';
import { musicLoopBeats, musicMelody, musicTempo } from './music-patterns';

describe('original playful arcade score', () => {
  it('loops in complete bars with a brisk pulse and real rests in the melody', () => {
    const loop = Array.from({ length: musicLoopBeats }, (_, beat) => notesAtBeat(beat));
    expect(notesAtBeat(musicLoopBeats)).toEqual(notesAtBeat(0));
    expect(notesAtBeat(musicLoopBeats * 20 + 7)).toEqual(notesAtBeat(7));
    expect(musicLoopBeats % 4).toBe(0);
    expect(musicMelody).toHaveLength(musicLoopBeats * 2);
    expect(musicMelody.filter(pitch => pitch === null).length).toBeGreaterThan(15);
    expect(musicTempo).toBeGreaterThanOrEqual(104);
    expect(musicTempo).toBeLessThanOrEqual(120);
    expect(musicBeatSeconds * musicLoopBeats).toBeGreaterThan(15);
    expect(musicBeatSeconds * musicLoopBeats).toBeLessThan(20);
    expect(loop.flat().length).toBeLessThan(160);
    for (const note of loop.flat()) {
      expect(note.pitch).toBeGreaterThanOrEqual(31);
      expect(note.pitch).toBeLessThanOrEqual(86);
      expect(note.gain).toBeLessThanOrEqual(.04);
      expect(note.attack).toBeLessThan(note.duration);
      expect(Number.isFinite(note.duration)).toBe(true);
      expect((note.offset || 0) + note.duration).toBeLessThan(musicBeatSeconds);
    }
  });
  it('uses audible eighth-note syncopation without long pad tails or a crowded foreground', () => {
    const loop = Array.from({ length: musicLoopBeats }, (_, beat) => notesAtBeat(beat));
    expect(loop.flat().some(note => note.offset === musicBeatSeconds / 2 && note.waveform === 'triangle')).toBe(true);
    expect(loop.flat().some(note => note.endPitch !== undefined && note.endPitch < note.pitch)).toBe(true);
    for (const notes of loop) {
      expect(notes.every(note => note.duration <= .2)).toBe(true);
      // Distinct half-beat attacks leave the more prominent star cue room to speak.
      for (const offset of [0, musicBeatSeconds / 2]) {
        const attackGain = notes.filter(note => (note.offset || 0) === offset).reduce((sum, note) => sum + note.gain, 0);
        expect(attackGain * .3).toBeLessThan(.03);
      }
    }
  });
});
