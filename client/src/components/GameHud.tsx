import type { LevelDefinition } from '../levels/types';
import { levelLabel } from '../levels/progression';
import type { Telemetry } from '../physics/world';
import { StarProgress } from './StarProgress';
import { AccelerationIndicator } from './AccelerationIndicator';

interface GameHudProps {
  level: LevelDefinition;
  telemetry: Telemetry;
  secondsLeft: number;
  menuOpen: boolean;
  onRetry: () => void;
  onResume: () => void;
  onOpenMenu: () => void;
  onTitle?: () => void;
}

export function GameHud({ level, telemetry, secondsLeft, menuOpen, onRetry, onResume, onOpenMenu, onTitle }: GameHudProps) {
  const canResume = telemetry.started && !telemetry.running && !menuOpen && !telemetry.tutorialId && !telemetry.won && !telemetry.timedOut;
  return (
    <header className="game-hud game-hud--with-vector">
      {onTitle ? <button className="game-brand" style={{ border: 0 }} aria-label="Title screen" title="Title screen" onClick={onTitle}>or</button>
        : <a href="/" className="game-brand" aria-label="Optional Reality home">or</a>}
      <div className="game-title">
        <span>OPTIONAL REALITY / {levelLabel(level)}</span>
        <h1>{level.title}</h1>
        <p>{level.instructions.objective}</p>
        <div className="hud-world-status">
          <StarProgress {...telemetry.stars} />
          <AccelerationIndicator acceleration={telemetry.acceleration} />
        </div>
      </div>
      <div className="hud-controls">
        {telemetry.overtime && <span className="overtime-tag" role="status">OVERTIME · walls active · −1 star</span>}
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
