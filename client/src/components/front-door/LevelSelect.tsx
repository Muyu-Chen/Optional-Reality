import { useState } from 'react';
import { levels, findLevel } from '../../levels/catalog';
import { tiers, levelLabel } from '../../levels/progression';
import { availableStars, journeyStars, type JourneyProgress } from '../../game/journey-progress';
import { LevelPreview } from './LevelPreview';
import { JourneyStars } from './JourneyStars';

const chapterDescriptions: Record<number, string> = {
  1: 'Set the world in motion. Learn how a well-timed message changes everything.',
  2: 'Bounce higher, slide farther, land softer. Find the route between the stars.',
  3: 'A small bakery with some unusual rules. Put familiar machines to unexpected use.',
};

export function LevelSelect({ progress, onPlay, onBack }: {
  progress: JourneyProgress; onPlay: (id: string) => void; onBack: () => void;
}) {
  const [chapter, setChapter] = useState(() => findLevel(progress.lastLevel || '')?.number || 1);
  const current = tiers.find(tier => tier.number === chapter)!;
  const currentLevels = levels.filter(level => level.number === chapter);
  return <section className="journey-select" aria-labelledby="journey-select-title">
    <header className="journey-select-heading">
      <div><button className="journey-back" onClick={onBack}>← Title screen</button>
        <h1 id="journey-select-title" tabIndex={-1}>Choose a possibility.</h1></div>
      <span className="journey-total"><span aria-hidden="true">★</span> {journeyStars(progress)} <small>/ {availableStars}</small><span className="journey-total-label">best stars</span></span>
    </header>
    <div className="journey-map">
      <nav className="journey-chapters" aria-label="Chapters">
        {tiers.map(tier => {
          const chapterLevels = levels.filter(level => level.number === tier.number);
          const collected = chapterLevels.reduce((sum, level) => sum + (progress.completed[level.id] || 0), 0);
          const total = chapterLevels.reduce((sum, level) => sum + (level.stars?.length || 0), 0);
          return <button key={tier.number} className={`journey-chapter journey-chapter--${tier.number}${chapter === tier.number ? ' is-current' : ''}`}
            aria-label={`Chapter ${tier.number} ${tier.title}, ${collected} of ${total} stars`}
            aria-current={chapter === tier.number ? 'true' : undefined} onClick={() => setChapter(tier.number)}>
            <span className="journey-chapter-number">0{tier.number}</span>
            <span className="journey-chapter-copy"><small>CHAPTER {tier.number}</small><strong>{tier.title}</strong><span>★ {collected} / {total}</span></span>
            <span className="journey-chapter-arrow" aria-hidden="true">↗</span>
          </button>;
        })}
        <p className="journey-explore-note">Every level is open.<br />Explore, retry, find another way.</p>
      </nav>
      <div className={`journey-chapter-content journey-chapter-content--${chapter}`}>
        <div className="journey-chapter-intro"><span className="journey-eyebrow">CHAPTER 0{chapter} · {currentLevels.length} LEVELS</span>
          <h2>{current.title}</h2><p>{chapterDescriptions[chapter]}</p></div>
        <div className="journey-level-grid">
          {currentLevels.map(level => {
            const complete = Object.hasOwn(progress.completed, level.id);
            return <button className={`journey-level${complete ? ' is-complete' : ''}`} key={level.id}
              onClick={() => onPlay(level.id)} aria-label={`Play ${levelLabel(level)} ${level.title}`}>
              <div className="journey-level-art"><LevelPreview level={level} />
                <span className="journey-level-number">{levelLabel(level)}</span>
                <span className="journey-level-play" aria-hidden="true">▶</span>
                {complete && <span className="journey-level-clear">✓ Cleared</span>}</div>
              <div className="journey-level-copy"><h3>{level.title}</h3>
                <p>{level.instructions.objective}</p>
                <div className="journey-level-bottom"><JourneyStars collected={progress.completed[level.id] || 0} total={level.stars?.length || 0} />
                  <span>{progress.lastLevel === level.id ? 'Last played' : complete ? 'Play again' : 'Explore'} <span aria-hidden="true">→</span></span></div>
              </div>
            </button>;
          })}
        </div>
      </div>
    </div>
  </section>;
}
