import { cubicBezier } from './geometry';
import type { LevelDefinition, Point } from './types';

const ramp: Point[] = [
  ...cubicBezier([[90, 175], [200, 285], [260, 400], [350, 400]], 28),
  ...cubicBezier([[350, 400], [440, 400], [470, 305], [555, 305]], 28).slice(1),
  [590, 305],
];

export const gravityLab: LevelDefinition = {
  id: 'gravity-lab',
  number: 1,
  title: 'Let It Roll',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30,
  initialAcceleration:[0,0],


  ball: {
    id: 'ball-A', label: 'BALL A', position: [165, 135], velocity: [0, 0],
    radius: 17, restitution: .02,
  },
  tracks: [{ id: 'ramp', points: ramp, thickness: 10 }],
  guideLines: [
    { from: ramp[0], to: [90, 454] },
    { from: ramp[28], to: [350, 454] },
    { from: ramp[56], to: [555, 454] },
    { from: [45, 455], to: [770, 455] },
  ],
  exit: { id: 'exit', label: 'EXIT', x: 728, y: 240, width: 49, height: 68 },
  stars:[{id:'descent',position:[200,230],radius:14},{id:'valley',position:[350,380],radius:14},{id:'inertia',position:[660,288],radius:14}],
  instructions: {
    timingLesson:'ramp',
    objective: 'Touch the exit',
    hint: 'Send “add gravity” to begin. Send “stop gravity” as the ball leaves the track.',
    sceneDescription: 'Live physics scene with a floating ball, a curved track, and an exit. The world starts with zero gravity.',
    canvasHeading: 'ZERO GRAVITY TO START',
    readyCaption: 'NO GRAVITY. NO MOTION.',
    exampleMessages: ['add gravity', 'stop gravity'],
    suggestedMessages: ['add gravity', 'stop gravity', 'reverse gravity'],
    exampleNotice: 'Messages prepared. Send the first to begin; send the second when the ball leaves the track.',
  },
};
