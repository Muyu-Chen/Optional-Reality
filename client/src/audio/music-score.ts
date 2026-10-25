import { musicLoopBeats, musicMelody, musicRoots, musicTempo } from './music-patterns';

export const musicBeatSeconds = 60 / musicTempo;

export interface MusicNote {
  pitch: number;
  duration: number;
  gain: number;
  waveform: OscillatorType;
  attack: number;
  offset?: number;
  endPitch?: number;
}

export function notesAtBeat(beat: number): MusicNote[] {
  const position = ((Math.floor(beat) % musicLoopBeats) + musicLoopBeats) % musicLoopBeats;
  const root = musicRoots[Math.floor(position / 4)];
  const inBar = position % 4;
  // Plucked bass and soft synthetic percussion replace the long ambient pads.
  const notes: MusicNote[] = [{ pitch: root - 12 + (inBar % 2 ? 7 : 0), duration: .19, gain: .038, waveform: 'triangle', attack: .008 }];
  if (inBar % 2 === 0) notes.push({ pitch: 43, endPitch: 31, duration: .12, gain: .028, waveform: 'sine', attack: .005 });
  else notes.push({ pitch: 73, endPitch: 58, duration: .065, gain: .012, waveform: 'sine', attack: .004 });
  notes.push({ pitch: 86, endPitch: 77, duration: .035, gain: .009, waveform: 'sine', attack: .003, offset: musicBeatSeconds / 2 });
  for (const half of [0, 1]) {
    const pitch = musicMelody[position * 2 + half];
    if (pitch !== null) notes.push({ pitch, duration: .15, gain: .032, waveform: 'triangle', attack: .007, offset: half * musicBeatSeconds / 2 });
  }
  return notes;
}
