import { useMemo } from 'react';
import type { LevelDefinition } from '../levels/types';
import { initialStateSummary } from '../levels/initial-state';
import { INITIAL_STATE_FADE_MS, useBriefingTimer } from '../game/useBriefingTimer';

export function InitialStateBriefing({ level, suspended, started }: {
  level: LevelDefinition; suspended: boolean; started: boolean;
}) {
  const summary = useMemo(() => initialStateSummary(level), [level]);
  const [x, y] = level.initialAcceleration;
  const angle = Math.atan2(y, x) * 180 / Math.PI;
  const { visible, fading, setHovered, setFocused, dismiss } = useBriefingTimer(suspended, started);
  if (!visible) return null;
  return (
    <section className={`initial-briefing glass${fading?' initial-briefing--fading':''}`} role="status" aria-label="Initial state"
      style={{transitionDuration:`${INITIAL_STATE_FADE_MS}ms`}}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{
        if(!event.currentTarget.contains(event.relatedTarget))setFocused(false);
      }}>
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
      <p><b>Start</b> runs the current world. <b>Send now</b> applies a queued rule and starts the run.</p>
    </section>
  );
}
