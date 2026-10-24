import { useEffect, useRef, useState } from 'react';
import type { LevelDefinition } from '../levels/types';
import { CanvasLab } from '../physics/canvas-lab';
import { initialTelemetry } from '../physics/world';

export function useGameWorld(level: LevelDefinition) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labRef = useRef<CanvasLab | null>(null);
  const [telemetry, setTelemetry] = useState(() => initialTelemetry(level));

  useEffect(() => {
    if (!canvasRef.current) return;
    document.title = `${level.title} — Optional Reality`;
    const lab = new CanvasLab(canvasRef.current, level, setTelemetry, true);
    labRef.current = lab;
    return () => {
      lab.destroy();
      labRef.current = null;
    };
  }, [level]);

  return { canvasRef, labRef, telemetry };
}
