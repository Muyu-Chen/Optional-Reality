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
    hint: 'Try changing the blue surface before impact. Too little bounce won’t reach the exit. Other environment rules are available too.',
    sceneDescription: 'A geometric physics puzzle: a ball moving right drops toward a flat floor. The exit is raised on the right. The blue surface returns energy on collision. Gravity, horizontal acceleration, surface restitution and friction are editable; the ball is protected.',
    canvasHeading: 'ENERGY AT THE MOMENT OF IMPACT', readyCaption: 'ONE COLLISION. A DIFFERENT POSSIBILITY.',
    exampleMessages: ['Set surface bounce to 0.9'], suggestedMessages: ['Set surface bounce to 0.9','Set surface bounce to 0.5'],
    exampleNotice: 'Your bounce rule is queued. Send before impact, then compare another value with Try again.',
  },
};
