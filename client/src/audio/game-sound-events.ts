export type GameSoundEvent = { kind: 'star'; collected: number }
  | { kind: 'spring' | 'rule' | 'exit' | 'complete' | 'cancel' };
type SoundListener = (event: GameSoundEvent) => void;
const listeners = new Set<SoundListener>();

export function subscribeGameSounds(listener: SoundListener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// Optional audio can never interrupt a physics step or a successfully applied rule.
export function emitGameSound(event: GameSoundEvent) {
  for (const listener of listeners) {
    try { listener(event); } catch { /* Browser audio can be unavailable. */ }
  }
}
