import type { LevelDefinition } from './types';

export const sideDoor: LevelDefinition = {
  id: 'side-door', number: 1, stage: 5, title: 'The Side Door',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration: [0, 0],
  environment: { restitution: 0, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [170, 90], velocity: [0, 0.3], radius: 16, restitution: 0 },
  tracks: [{ id: 'shelf', label: 'Shelf', preset: true, points: [[40, 270], [300, 270]], thickness: 12 }],
  guideLines: [],
  stars: [
    { id: 'steer-out', position: [250, 185], radius: 22 },
    { id: 'around-the-tip', position: [390, 315], radius: 26 },
    { id: 'steer-back', position: [350, 370], radius: 26 },
  ],
  exit: { id: 'exit', label: 'SIDE DOOR', x: 140, y: 430, width: 140, height: 60 },
  instructions: {
    objective: 'Steer around the shelf and return underneath it.',
    hint: 'The ball already moves downward. Send “acceleration rightward 0.15”, then “acceleration leftward 0.15” around the first star. It keeps drifting right long enough to clear the shelf, then curves back left. Horizontal rules preserve its downward motion.',
    sceneDescription: 'A protected ball starts with constant downward velocity and zero acceleration. A fixed horizontal shelf blocks the direct route to a lower-left exit. Three stars trace a sideways S around the right tip of the shelf. Changing horizontal acceleration preserves the vertical component and existing velocity. The shelf is preset; all environment rules are editable; all four edges are open.',
    canvasHeading: 'ONE AXIS AT A TIME.', readyCaption: 'TAKE THE LONG WAY ROUND.',
    exampleMessages: ['acceleration rightward 0.15', 'acceleration leftward 0.15'],
    suggestedMessages: ['acceleration rightward 0.15', 'acceleration leftward 0.15', 'stop gravity'],
    exampleNotice: 'Start by steering right. Switch to leftward acceleration near the first star, before reaching the shelf.',
  },
};
