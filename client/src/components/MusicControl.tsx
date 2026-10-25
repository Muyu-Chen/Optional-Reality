import { useBackgroundMusic } from '../audio/use-background-music';

const descriptions = {
  playing: 'Quiet background music is playing.',
  waiting: 'Music starts after your first interaction and pauses when this tab is hidden.',
  muted: 'Background music is off.',
  blocked: 'Your browser paused audio. Another interaction will retry.',
  unavailable: 'Audio is unavailable in this browser. You can keep playing.',
};

export function MusicControl() {
  const music = useBackgroundMusic();
  return (
    <button className={`music-control ${music.status === 'playing' ? 'is-playing' : ''}`}
      aria-label={music.enabled ? 'Turn music off' : 'Turn music on'} aria-pressed={music.enabled}
      title={`${descriptions[music.status]} ${music.enabled ? 'Turn music off.' : 'Turn music on.'}`}
      onClick={event => music.toggle(event.nativeEvent.isTrusted)}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M8 13V4l8-2v9M8 7l8-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="5.5" cy="14" rx="2.5" ry="2" fill="currentColor" />
        <ellipse cx="13.5" cy="12" rx="2.5" ry="2" fill="currentColor" />
        {!music.enabled && <path d="m3 3 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
      </svg>
      <span>Music {music.enabled ? 'on' : 'off'}</span>
      <i aria-hidden="true" />
    </button>
  );
}
