import type { LevelDefinition } from '../levels/types';
import type { Telemetry } from '../physics/world';

interface TeachingOverlayProps {
  tutorial: NonNullable<LevelDefinition['tutorials']>[number];
  preparing: boolean;
  onContinue: () => void;
}

export function TeachingOverlay({ tutorial, preparing, onContinue }: TeachingOverlayProps) {
  return (
    <div className="stage-overlay">
      <section className="game-menu glass tutorial-card" role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
        <span className="menu-eyebrow">FIRST ENCOUNTER / TIME PAUSED</span>
        <h2 id="tutorial-title">{tutorial.title}</h2>
        <p>{tutorial.body}</p>
        <button className="primary-button" disabled={preparing} onClick={onContinue}>Continue →</button>
      </section>
    </div>
  );
}

export function TimingHint({ hasMessages, telemetry, lesson }: { hasMessages: boolean; telemetry: Telemetry; lesson: 'ramp'|'spring' }) {
  const hint = lesson==='spring' ? !hasMessages ? 'Queue “add gravity” and “reverse gravity” — or load the starter messages.'
    : !telemetry.started ? 'Fall toward the first star. The spring charges and releases automatically.'
    : telemetry.stars.collected>=2 ? 'The higher star is still ahead. Try changing the acceleration direction.'
    : 'Watch the spring compress and release. Your next message is ready when you choose.'
    : !hasMessages ? 'Queue “add gravity” and “stop gravity” — or load the starter messages.'
    : !telemetry.started ? 'Send now applies your first rule. The next message stays ready.'
    : telemetry.acceleration.y !== 0 ? 'Watch the ball. Send “stop gravity” as it leaves the ramp.'
    : 'Gravity is off. The ball keeps its momentum.';
  return <aside className="tutorial-hint"><span>LEARN THE TIMING</span><p>{hint}</p></aside>;
}
