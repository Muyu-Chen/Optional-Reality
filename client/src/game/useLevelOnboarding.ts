import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { onboardingFor, onboardingStorageKey } from '../levels/onboarding';
import type { LevelDefinition } from '../levels/types';
import type { CanvasLab } from '../physics/canvas-lab';

function wasSeen(key: string) {
  try { return localStorage.getItem(key) === 'seen'; } catch { return false; }
}

export function useLevelOnboarding(level: LevelDefinition, labRef: RefObject<CanvasLab | null>,
  cancelImmediate: () => void, openSettings: () => void) {
  const lesson = onboardingFor(level.id), key = onboardingStorageKey(level.id);
  const [visible, setVisible] = useState(() => !!lesson && !wasSeen(key));
  const visibleRef = useRef(visible), returnToSettings = useRef(false);
  const markSeen = useCallback(() => {
    try { localStorage.setItem(key, 'seen'); } catch { /* This mount still remembers dismissal. */ }
  }, [key]);
  const pause = useCallback(() => {
    cancelImmediate();labRef.current?.world.pause();labRef.current?.report();
  }, [cancelImmediate, labRef]);
  const open = useCallback((fromSettings = false) => {
    if (!lesson) return;
    returnToSettings.current = fromSettings;visibleRef.current = true;
    pause();markSeen();setVisible(true);
  }, [lesson, pause, markSeen]);
  const close = useCallback((showSettings = false) => {
    visibleRef.current = false;setVisible(false);markSeen();
    const backToSettings = showSettings || returnToSettings.current;
    returnToSettings.current = false;
    if (backToSettings) openSettings();
  }, [markSeen, openSettings]);
  useEffect(() => {
    if (visible) { pause();markSeen(); }
  }, [visible, pause, markSeen]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!visibleRef.current || event.isComposing) return;
      const settings = event.key === 'Tab' && event.shiftKey;
      if (event.key !== 'Escape' && !settings) return;
      event.preventDefault();event.stopImmediatePropagation();close(settings);
    }
    // The tutorial owns these keys before the ordinary game shortcuts see them.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [close]);
  return { lesson, visible, open, close, isVisible: useCallback(() => visibleRef.current, []) };
}
