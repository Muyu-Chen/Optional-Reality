import { completionStars } from '../domain/round';
import { levelLabel } from '../levels/progression';
import type { LevelDefinition } from '../levels/types';
import { ResultStars } from './ResultStars';

interface CompletionResultProps {
  level: LevelDefinition;
  overtime?: boolean;
  stars: { collected: number; total: number };
  nextLevel?: LevelDefinition;
  onNext: () => void;
  onRetry: () => void;
}

export function CompletionResult({ level, stars, overtime = false, nextLevel, onNext, onRetry }: CompletionResultProps) {
  const earned = completionStars(stars.collected,overtime);
  const fullScore = stars.total > 0 && earned === stars.total;
  const message = overtime ? `${stars.collected} collected − 1 overtime star = ${earned} earned (minimum 0). Retry within ${level.timeLimitSeconds} seconds to keep every star.` : fullScore ? 'Full score. Every star collected.'
    : stars.total > 0 && stars.collected === 0
      ? 'Not a single star? Even a cave dweller from a million years ago could get all three.'
      : 'Exit reached. Collect every star for full score.';
  return <div className={`completion-result${fullScore ? ' completion-result--full' : ''}`}>
    <div className="completion-level">
      <span className="completion-level-number">{levelLabel(level)}</span>
      <span>{level.title}</span>
    </div>
    <span className="completion-badge">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7" /></svg>
      {overtime ? 'OVERTIME CLEAR · −1 STAR' : fullScore ? 'FULL SCORE' : 'LEVEL COMPLETE'}
    </span>
    <h2 id="menu-title">{fullScore ? 'Beautifully done.' : level.presentation === 'bakery' ? 'Order delivered.' : 'You found a way.'}</h2>
    <ResultStars total={stars.total} collected={earned} />
    <p className="completion-message">{message}</p>
    <div className="completion-actions">
      {nextLevel && <button className="primary-button completion-next" aria-label="Next level →" onClick={onNext}>Next level <span aria-hidden="true">→</span></button>}
      <button className={nextLevel ? 'completion-retry' : 'primary-button completion-next'} onClick={onRetry}>Try again</button>
    </div>
    {nextLevel && <p className="completion-up-next"><span>UP NEXT</span> {levelLabel(nextLevel)} · {nextLevel.title}</p>}
  </div>;
}
