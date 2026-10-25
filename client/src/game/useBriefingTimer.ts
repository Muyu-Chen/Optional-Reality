import { useEffect, useRef, useState } from 'react';

export const INITIAL_STATE_DURATION_MS = 5000;
export const INITIAL_STATE_FADE_MS = 400;

/** Five readable seconds, then a reversible fade; hover/focus hold the card open. */
export function useBriefingTimer(suspended: boolean, started: boolean) {
  const remaining = useRef(INITIAL_STATE_DURATION_MS);
  const fadeRemaining = useRef(INITIAL_STATE_FADE_MS);
  const [expired, setExpired] = useState(false);
  const [fading, setFading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => {
    if (suspended || hidden || started || expired) {
      setHovered(false);setFocused(false);
      return;
    }
    if (hovered || focused) {
      remaining.current=INITIAL_STATE_DURATION_MS;fadeRemaining.current=INITIAL_STATE_FADE_MS;
      setFading(false);
      return;
    }
    const clock=fading?fadeRemaining:remaining;
    const since = performance.now();
    const timer = window.setTimeout(() => {
      if(fading || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)setExpired(true);
      else setFading(true);
    }, clock.current);
    return () => {
      window.clearTimeout(timer);
      clock.current = Math.max(0, clock.current - (performance.now() - since));
    };
  }, [suspended, hidden, started, expired, fading, hovered, focused]);
  return { visible: !suspended && !hidden && !started && !expired, fading,
    setHovered,setFocused,dismiss: () => setExpired(true) };
}
