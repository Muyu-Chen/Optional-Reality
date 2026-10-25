import { memo, useEffect, useRef, useState } from 'react';
import type { AccelerationVector } from '../../../shared/acceleration';
import { accelerationDisplay, sameAcceleration } from '../domain/acceleration-display';

export const ACCELERATION_HIGHLIGHT_MS = 600;
interface AccelerationIndicatorProps { acceleration: Readonly<AccelerationVector> }

function AccelerationIndicatorView({ acceleration }: AccelerationIndicatorProps) {
  const view = accelerationDisplay(acceleration), previous = useRef(view.key);
  const [highlight, setHighlight] = useState({ version: 0, active: false });
  useEffect(() => {
    if (previous.current === view.key) return;
    previous.current = view.key;
    setHighlight(value => ({ version: value.version + 1, active: true }));
    const timer = window.setTimeout(() => setHighlight(value => ({ ...value, active: false })), ACCELERATION_HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [view.key]);
  return <span className="acceleration-indicator" role="status" aria-atomic="true" aria-label={view.accessibleLabel} title={view.accessibleLabel}>
    <span key={highlight.version} className={`acceleration-indicator-content${highlight.active ? ' acceleration-indicator-content--changed' : ''}`} aria-hidden="true">
      <span className="acceleration-indicator-prefix">a</span>
      <svg className="acceleration-indicator-vector" viewBox="0 0 24 24" width="18" height="18" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {view.direction === 'zero' || view.direction === 'unavailable'
          ? <path d="M6 9h12M6 15h12" />
          : <path d="M5 12h14m-6-6 6 6-6 6" transform={`rotate(${view.angleDegrees} 12 12)`} />}
      </svg>
      <span className="acceleration-indicator-value">{view.value}</span>
      <span className="acceleration-indicator-unit">m/s²</span>
    </span>
  </span>;
}

// Telemetry refreshes carry new objects; unchanged rule vectors need no UI update.
export const AccelerationIndicator = memo(AccelerationIndicatorView,
  (before, after) => sameAcceleration(before.acceleration, after.acceleration));
