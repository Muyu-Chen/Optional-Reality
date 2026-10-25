// Original eight-bar arcade phrase; no sampled or transcribed game soundtrack.
export const musicTempo = 112;
export const musicLoopBeats = 32;
export const musicRoots = [48, 53, 45, 43, 48, 50, 53, 43] as const;

// Eighth-note cells. Rests keep the tune light and leave room for pickup sounds.
export const musicMelody: readonly (number | null)[] = [
  72, null, 76, 79, null, 76, 74, null,
  77, null, 79, 81, 79, null, 76, null,
  76, null, 72, 69, null, 72, 76, null,
  74, 76, null, 79, 74, null, 71, null,
  72, null, 79, 76, null, 74, 76, 79,
  77, null, 74, 69, 74, null, 77, null,
  81, 79, 77, null, 76, null, 74, null,
  71, null, 74, 79, 74, null, 71, null,
];
