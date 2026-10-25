import { useEffect, useRef, useState } from 'react';

export const INITIAL_STATE_DURATION_MS = 3000;

/** Three visible seconds; dialogs and background tabs do not spend this time. */
export function useBriefingTimer(suspended: boolean, started: boolean) {
  const remaining = useRef(INITIAL_STATE_DURATION_MS);
  const [expired, setExpired] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => {
    if (suspended || hidden || started || expired) return;
    const since = performance.now();
    const timer = window.setTimeout(() => setExpired(true), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - since));
    };
  }, [suspended, hidden, started, expired]);
  return { visible: !suspended && !hidden && !started && !expired, dismiss: () => setExpired(true) };
}
