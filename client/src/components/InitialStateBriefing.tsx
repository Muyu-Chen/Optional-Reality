import { useMemo } from 'react';
import type { LevelDefinition } from '../levels/types';
import { initialStateSummary } from '../levels/initial-state';
import { useBriefingTimer } from '../game/useBriefingTimer';

export function InitialStateBriefing({ level, suspended, started }: {
  level: LevelDefinition; suspended: boolean; started: boolean;
}) {
  const summary = useMemo(() => initialStateSummary(level), [level]);
  const [x, y] = level.initialAcceleration;
  const angle = Math.atan2(y, x) * 180 / Math.PI;
  const { visible, dismiss } = useBriefingTimer(suspended, started);
  if (!visible) return null;
  return (
    <section className="initial-briefing glass" role="status" aria-label="Initial state">
      <header>
        <span>BEFORE YOU BEGIN</span>
        <button aria-label="Dismiss initial state" onClick={dismiss}>×</button>
      </header>
      <h2>Your starting world</h2>
      <dl>
        <div><dt><span className="briefing-ball" aria-hidden="true" />{summary.actor}</dt><dd>{summary.motion}</dd></div>
        <div><dt><span className="briefing-acceleration" aria-hidden="true" style={{ transform: `rotate(${x || y ? angle : 0}deg)` }}>{x || y ? '→' : '○'}</span>Acceleration</dt><dd>{summary.acceleration}</dd></div>
      </dl>
      <ul className="briefing-surfaces">{summary.surfaces.map((surface, index) => <li key={index}>{surface}</li>)}</ul>
      {!!summary.devices.length && <ul className="briefing-devices">{summary.devices.map((device, index) => <li key={index}>{device}</li>)}</ul>}
      <p>Ready when you are. <b>Send now</b> starts the run.</p>
    </section>
  );
}
