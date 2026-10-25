import type { LevelDefinition } from './types';

export const doubleBank: LevelDefinition = {
  id: 'double-bank', number: 2, stage: 8, title: 'Double Bank',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 }, timeLimitSeconds: 30,
  initialAcceleration: [0, 0], environment: { restitution: 0.1, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [100, 380], velocity: [2.5, 0], radius: 16, restitution: 0 },
  tracks: [
    { id: 'lower-bank', label: 'Lower bank', aliases: ['lower bank', '下斜板'], feature: 'bounce', points: [[380, 450], [560, 270]], thickness: 12 },
    { id: 'upper-bank', label: 'Upper bank', aliases: ['upper bank', '上斜板'], feature: 'bounce', points: [[350, 250], [540, 60]], thickness: 12 },
  ], guideLines: [],
  stars: [{ id: 'approach', position: [280, 380], radius: 16 }, { id: 'upward', position: [425, 320], radius: 20 }, { id: 'outward', position: [590, 190], radius: 22 }],
  exit: { id: 'exit', label: 'TWO TURNS', x: 710, y: 140, width: 65, height: 110 },
  instructions: {
    objective: 'Bounce up from one bank, then right from the other.',
    hint: 'Set surface bounce to 1 before the first impact. The lower bank turns rightward motion upward; the upper bank turns it right again. There is no gravity. Try changing one bank at a time to see how a small loss at the first impact changes the second approach.',
    sceneDescription: 'A protected ball drifts right at 2.5 m/s in zero gravity toward two editable blue 45-degree banks. lower-bank redirects it upward; upper-bank redirects it right toward the exit. Three stars follow the two-turn route. Each bank has independent bounce and friction; general surface rules change both. No devices or direct ball edits. All edges are open.',
    canvasHeading: 'RIGHT. UP. RIGHT AGAIN.', readyCaption: 'TWO COLLISIONS, ONE CONTINUOUS FLIGHT.',
    exampleMessages: ['Set surface bounce to 1'],
    suggestedMessages: ['Set surface bounce to 1', 'Set lower bank bounce to 0.9', 'Set upper bank bounce to 1'],
    exampleNotice: 'Send bounce 1 to start the route. Both angled banks must redirect the ball; no timed gravity change is needed.',
  },
};
