import { levels } from '../levels/catalog';
import { levelLabel, tiers } from '../levels/progression';
import type { LevelDefinition } from '../levels/types';
import type { Telemetry } from '../physics/world';
import { CompletionResult } from './CompletionResult';

interface GameMenuProps {
  level: LevelDefinition;
  telemetry: Telemetry;
  preparing: boolean;
  onChooseLevel: (id: string) => void;
  onResume: () => void;
  onRetry: () => void;
  onReset: () => void;
  onReplayTeaching: () => void;
}

export function GameMenu({ level, telemetry, preparing, onChooseLevel, onResume, onRetry, onReset, onReplayTeaching }: GameMenuProps) {
  const ended = telemetry.won || telemetry.timedOut;
  const nextLevel = levels[levels.findIndex(item => item.id === level.id) + 1];
  const title = telemetry.fell ? 'Mind the gap.' : telemetry.timedOut ? 'A different timing?' : 'Paused.';
  return (
    <div className={`stage-overlay${telemetry.won ? ' stage-overlay--complete' : ''}`}>
      <section className={`game-menu glass${telemetry.won ? ' game-menu--complete' : ''}`} role="dialog" aria-modal="false" aria-labelledby="menu-title">
        {telemetry.won ? <CompletionResult
          level={level} stars={telemetry.stars} nextLevel={nextLevel}
          onNext={() => nextLevel && onChooseLevel(nextLevel.id)} onRetry={onRetry}
        /> : <>
          <span className="menu-eyebrow">{ended ? 'ANOTHER POSSIBILITY' : 'TAKE YOUR TIME'}</span>
          <h2 id="menu-title">{title}</h2>
          <p>{ended ? 'Try the same messages at different moments.' : level.instructions.hint}</p>
          <div className="menu-buttons">
            {!ended && <button className="primary-button" disabled={preparing} onClick={onResume}>
              {telemetry.started ? 'Resume' : 'Back to game'}
            </button>}
            <button className={ended ? 'primary-button' : 'small-button'} onClick={onRetry}>Try again</button>
          </div>
        </>}
        <div className="menu-utilities">
          <button className="quiet-button" onClick={onReset}>Restart & reprepare messages</button>
          {!!level.tutorials?.length && <button className="quiet-button" onClick={onReplayTeaching}>Replay teaching</button>}
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
