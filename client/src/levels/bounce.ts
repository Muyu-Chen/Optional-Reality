import type { LevelDefinition } from './types';

export const bounce: LevelDefinition = {
  id: 'bounce', number: 2, stage: 1, title: 'A Little More Bounce',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialGravity: 1,
  editableWorldProperties: ['restitution'], editableSurfaceProperties: ['restitution'],
  environment: { restitution: .1, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [120,130], velocity: [1.5,0], radius: 16, restitution: 0 },
  tracks: [{ id: 'bounce-floor', feature: 'bounce', points: [[60,427],[760,427]], thickness: 14 }],
  guideLines: [], exit: { id: 'exit', label: 'EXIT', x: 684, y: 145, width: 70, height: 95 },
  instructions: {
    objective: 'Bounce the ball into the raised exit',
    hint: 'Only surface bounce can change here. Set it before the ball hits the floor. Too little bounce won’t reach the exit.',
    sceneDescription: 'A geometric physics puzzle: a ball moving right drops toward a flat floor. The exit is raised on the right. Gravity and the ball are fixed. Only surface restitution (bounce) is editable; it controls how much energy is returned on collision.',
    canvasHeading: 'ENERGY AT THE MOMENT OF IMPACT', readyCaption: 'ONE COLLISION. A DIFFERENT POSSIBILITY.',
    exampleMessages: ['Set surface bounce to 0.9'], suggestedMessages: ['Set surface bounce to 0.9','Set surface bounce to 0.5'],
    exampleNotice: 'Your bounce rule is queued. Send before impact, then compare another value with Try again.',
  },
};
