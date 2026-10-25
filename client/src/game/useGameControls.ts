import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { CanvasLab } from '../physics/canvas-lab';

export function useGameControls(labRef: RefObject<CanvasLab | null>, preparing: boolean, cancelImmediate?:()=>void) {
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = useCallback(() => {
    if (labRef.current?.world.won || labRef.current?.world.timedOut) return;
    cancelImmediate?.();
    labRef.current?.world.pause();
    labRef.current?.report();
    setMenuOpen(true);
  }, [labRef,cancelImmediate]);

  const resumeGame = useCallback(() => {
    if (!preparing && labRef.current?.world.started) labRef.current.world.start();
    labRef.current?.report();
    setMenuOpen(false);
  }, [labRef, preparing]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if(event.isComposing)return;
      if(event.key==='Tab' && event.shiftKey) {
        event.preventDefault();
        if(!labRef.current?.world.won && !labRef.current?.world.timedOut)openMenu();
        return;
      }
      if (event.key !== 'Escape') return;
      if (menuOpen) resumeGame();
      else if (!labRef.current?.world.won && !labRef.current?.world.timedOut) openMenu();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [labRef, menuOpen, openMenu, resumeGame]);

  return { menuOpen, setMenuOpen, openMenu, resumeGame };
}
