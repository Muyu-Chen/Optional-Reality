import { levels } from '../levels/catalog';
import { levelLabel, tiers } from '../levels/progression';
import type { LevelDefinition } from '../levels/types';
import type { Telemetry } from '../physics/world';
import { CompletionResult } from './CompletionResult';
import { SoundEffectsControl } from './SoundEffectsControl';
import { MusicControl } from './MusicControl';

interface GameMenuProps {
  level: LevelDefinition;
  telemetry: Telemetry;
  preparing: boolean;
  onChooseLevel: (id: string) => void;
  onResume: () => void;
  onRetry: () => void;
  onReset: () => void;
  onReplayTeaching: () => void;
  onHowToPlay?: () => void;
  onTitle?: () => void;
  onLevelSelect?: () => void;
}

export function GameMenu({ level, telemetry, preparing, onChooseLevel, onResume, onRetry, onReset, onReplayTeaching, onHowToPlay, onTitle, onLevelSelect }: GameMenuProps) {
  const ended = telemetry.won || telemetry.timedOut;
  const nextLevel = levels[levels.findIndex(item => item.id === level.id) + 1];
  const title = telemetry.outOfBounds || telemetry.fell ? 'Out of bounds.' : telemetry.timedOut ? 'A different timing?' : 'Paused.';
  return (
    <div className={`stage-overlay${ended ? ' stage-overlay--ended' : ''}${telemetry.won ? ' stage-overlay--complete' : ''}`}>
      <section className={`game-menu glass${telemetry.won ? ' game-menu--complete' : ''}`} role="dialog" aria-modal="false" aria-labelledby="menu-title">
        {telemetry.won ? <CompletionResult
          level={level} stars={telemetry.stars} overtime={telemetry.overtime} nextLevel={nextLevel}
          onNext={() => nextLevel && onChooseLevel(nextLevel.id)} onRetry={onRetry}
        /> : <>
          <span className="menu-eyebrow">{ended ? 'ANOTHER POSSIBILITY' : 'TAKE YOUR TIME'}</span>
          <h2 id="menu-title">{title}</h2>
          <p>{telemetry.outOfBounds || telemetry.fell ? 'The ball left the play area. Try again with a different timing.' : ended ? 'Try the same messages at different moments.' : level.instructions.hint}</p>
          <div className="menu-buttons">
            {!ended && <button className="primary-button" disabled={preparing} onClick={onResume}>
              {telemetry.started ? 'Resume' : 'Back to game'}
            </button>}
            <button className={ended ? 'primary-button' : 'small-button'} onClick={onRetry}>Try again</button>
          </div>
        </>}
        <div className="menu-utilities">
          {!telemetry.won && <div className="menu-audio-settings"><MusicControl /><SoundEffectsControl /></div>}
          {onHowToPlay && !ended && <button className="quiet-button" onClick={onHowToPlay}>How to play</button>}
          <button className="quiet-button" onClick={onReset}>Restart & reprepare messages</button>
          {!!level.tutorials?.length && <button className="quiet-button" onClick={onReplayTeaching}>Replay teaching</button>}
          {(onTitle || onLevelSelect) && <div className="menu-journey-navigation">
            {onLevelSelect && <button className="small-button" onClick={onLevelSelect}>Level select <span aria-hidden="true">▦</span></button>}
            {onTitle && <button className="quiet-button" onClick={onTitle}>Title screen</button>}
          </div>}
        </div>
        <details className="level-list">
          <summary>Choose a level</summary>
          {tiers.map(tier => <div className="tier-group" key={tier.number}>
            <strong>LEVEL {tier.number} / {tier.title}</strong>
            {levels.filter(item => item.number === tier.number).map(item => (
              <button className={item.id === level.id ? 'active' : ''} key={item.id} onClick={() => onChooseLevel(item.id)}>
                {levelLabel(item)} · {item.title}
              </button>
            ))}
          </div>)}
        </details>
      </section>
    </div>
  );
}
