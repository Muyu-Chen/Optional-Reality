// Original, deliberately sparse 8-bar loop. MIDI pitches are musical data, not an audio download.
export const musicBeatSeconds = 60 / 84;
const chords = [
  [48, 55, 62], [45, 52, 60], [53, 60, 67], [43, 50, 57],
  [48, 55, 64], [45, 52, 59], [53, 60, 64], [43, 50, 62],
] as const;
const melody: readonly (number | null)[] = [
  72, null, 76, 79, 74, null, 72, 69,
  72, 77, null, 76, 74, null, 71, 67,
  72, null, 79, 76, 71, 72, null, 76,
  77, null, 76, 72, 74, 71, null, null,
];

export interface MusicNote {
  pitch: number;
  duration: number;
  gain: number;
  waveform: OscillatorType;
  attack: number;
}

export function notesAtBeat(beat: number): MusicNote[] {
  const position = beat % melody.length;
  const chord = chords[Math.floor(position / 4)];
  const notes: MusicNote[] = [];
  if (position % 4 === 0) {
    for (const pitch of chord) notes.push({ pitch, duration: musicBeatSeconds * 3.8, gain: .028, waveform: 'sine', attack: .2 });
  }
  if (position % 2 === 0) notes.push({ pitch: chord[0] - 12, duration: musicBeatSeconds * 1.5, gain: .055, waveform: 'sine', attack: .04 });
  const pitch = melody[position];
  if (pitch !== null) notes.push({ pitch, duration: musicBeatSeconds * .9, gain: .06, waveform: 'triangle', attack: .025 });
  return notes;
}
