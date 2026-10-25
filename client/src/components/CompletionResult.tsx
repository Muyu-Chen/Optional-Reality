import { levelLabel } from '../levels/progression';
import type { LevelDefinition } from '../levels/types';
import { ResultStars } from './ResultStars';

interface CompletionResultProps {
  level: LevelDefinition;
  stars: { collected: number; total: number };
  nextLevel?: LevelDefinition;
  onNext: () => void;
  onRetry: () => void;
}

export function CompletionResult({ level, stars, nextLevel, onNext, onRetry }: CompletionResultProps) {
  const fullScore = stars.total > 0 && stars.collected === stars.total;
  const message = fullScore ? 'Full score. Every star collected.'
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
      {fullScore ? 'FULL SCORE' : 'LEVEL COMPLETE'}
    </span>
    <h2 id="menu-title">{fullScore ? 'Beautifully done.' : level.presentation === 'bakery' ? 'Order delivered.' : 'You found a way.'}</h2>
    <ResultStars {...stars} />
    <p className="completion-message">{message}</p>
    <div className="completion-actions">
      {nextLevel && <button className="primary-button completion-next" aria-label="Next level →" onClick={onNext}>Next level <span aria-hidden="true">→</span></button>}
      <button className={nextLevel ? 'completion-retry' : 'primary-button completion-next'} onClick={onRetry}>Try again</button>
    </div>
    {nextLevel && <p className="completion-up-next"><span>UP NEXT</span> {levelLabel(nextLevel)} · {nextLevel.title}</p>}
  </div>;
}
