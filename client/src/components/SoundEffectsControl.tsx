import { useSoundEffects } from '../audio/use-sound-effects';

export function SoundEffectsControl() {
  const sound = useSoundEffects();
  return <button className="quiet-button sound-effects-control" aria-pressed={sound.enabled}
    aria-label={sound.enabled ? 'Turn sound effects off' : 'Turn sound effects on'}
    title="Star pickups and game actions. Background music has its own control."
    onClick={event => sound.toggle(event.nativeEvent.isTrusted)}>
    <svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 8h3l4-3v10l-4-3H3Z" strokeLinejoin="round" />
      {sound.enabled ? <path d="M13 7c2 1 2 5 0 6m2-8c4 3 4 7 0 10" strokeLinecap="round" /> : <path d="m13 8 4 4m0-4-4 4" strokeLinecap="round" />}
    </svg>
    Sound effects {sound.enabled ? 'on' : 'off'}
  </button>;
}
