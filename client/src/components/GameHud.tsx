import type { LevelDefinition } from '../levels/types';
import { levelLabel } from '../levels/progression';
import type { Telemetry } from '../physics/world';
import { StarProgress } from './StarProgress';

interface GameHudProps {
  level: LevelDefinition;
  telemetry: Telemetry;
  secondsLeft: number;
  menuOpen: boolean;
  onRetry: () => void;
  onResume: () => void;
  onOpenMenu: () => void;
}

export function GameHud({ level, telemetry, secondsLeft, menuOpen, onRetry, onResume, onOpenMenu }: GameHudProps) {
  const canResume = telemetry.started && !telemetry.running && !menuOpen && !telemetry.tutorialId && !telemetry.won && !telemetry.timedOut;
  return (
    <header className="game-hud">
      <a href="/" className="game-brand" aria-label="Optional Reality home">or</a>
      <div className="game-title">
        <span>OPTIONAL REALITY / {levelLabel(level)}</span>
        <h1>{level.title}</h1>
        <p>{level.instructions.objective}</p>
        <StarProgress {...telemetry.stars} />
      </div>
      <div className="hud-controls">
        <span className={`game-clock ${secondsLeft <= 5 ? 'urgent' : ''}`} data-testid="time-left">
          {secondsLeft}<small>s</small>
        </span>
        <button className="icon-button" aria-label="Try again" title="Try again" onClick={onRetry}>↻</button>
        <button className="icon-button" aria-label={canResume ? 'Resume game' : 'Pause menu'}
          disabled={telemetry.won || telemetry.timedOut} onClick={canResume ? onResume : onOpenMenu}>
          {canResume ? '▷' : 'Ⅱ'}
        </button>
      </div>
    </header>
  );
}
