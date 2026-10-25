/** One deterministic timeline drives both the browser layers and the exported GIF. */
export const LOOP_SECONDS = 8.4;
export const SILHOUETTE = 'M400 35C550 8 718 111 755 276c41 181-51 326-205 353C368 662 181 655 97 501 21 361 73 184 194 103 264 56 332 48 400 35Z';
export const BOXES = {
  landscape: { x: 45, y: 0, width: 725, height: 680 },
  islandLeft: { x: 65, y: 414, width: 240, height: 166 },
  islandRight: { x: 475, y: 390, width: 220, height: 152 },
  exit: { x: 559, y: 244, width: 87, height: 149 },
} as const;
export const STAR_TIMES = [.9, 1.9, 2.95] as const;
export function flightPosition(seconds: number) {
  const t = Math.max(0, seconds);
  const accelerated = Math.min(t, 2.4);
  return { x: 180 + 120 * t, y: 396 - 180 * accelerated + 52.5 * accelerated ** 2 + Math.max(0, t - 2.4) * 72 };
}
export const TRAJECTORY_POINTS = Array.from({ length: 36 }, (_, i) => flightPosition(i / 10));
export const TRAJECTORY_PATH = TRAJECTORY_POINTS.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function titleFrame(seconds: number, still = false) {
  const time = still ? 2.5 : ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  const flight = clamp((time - .9) / 3.5) * 3.5;
  const point = flightPosition(flight);
  const absorb = clamp((time - 4.4) / .9);
  const ease = absorb * absorb * (3 - 2 * absorb);
  const reset = clamp((time - 7.4) / 1);
  return {
    time, flight, absorb,
    ball: { x: point.x + (602 - point.x) * ease, y: point.y + (331 - point.y) * ease,
      scale: 1 - ease, rotation: flight * 2.2 + ease * 7, opacity: 1 - ease },
    stars: STAR_TIMES.map((at, index) => {
      const point = flightPosition(at);
      const pickup = still ? 0 : clamp((flight - at) / .3);
      return { ...point, y: point.y - pickup * 22, opacity: still ? 1 : (1 - pickup) + reset * pickup,
        scale: 1 + pickup * .5, rotation: Math.sin(time * 1.4 + index) * .09,
        sparkle: pickup > 0 && pickup < 1 ? Math.sin(pickup * Math.PI) : 0 };
    }),
    clouds: [{ x: 110 + Math.sin(time * Math.PI * 2 / LOOP_SECONDS) * 13, y: 138, width: 155, height: 67 },
      { x: 435 + Math.sin(time * Math.PI * 2 / LOOP_SECONDS + 1.5) * 17, y: 100, width: 180, height: 76 }],
    caption: time < .9 ? 'Choose the moment.' : time < 3.3 ? 'Gravity is on.' : time < 4.4 ? '“Turn off gravity.”' : time < 6.8 ? 'Three stars. Your way.' : 'Try a different rule.',
    activeStars: still ? 0 : STAR_TIMES.filter(at => flight >= at).length,
    portal: absorb > 0 && absorb < 1 ? Math.sin(absorb * Math.PI) : 0,
    sceneOpacity: still ? 1 : Math.min(clamp(time / .35), 1 - reset),
  };
}
