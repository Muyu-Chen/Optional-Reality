import type { LevelDefinition } from './types';

export const bounce: LevelDefinition = {
  id: 'bounce', number: 2, stage: 2, title: 'A Little More Bounce',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration:[0,1],

  environment: { restitution: .1, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [120,130], velocity: [1.5,0], radius: 16, restitution: 0 },
  tracks: [{ id: 'bounce-floor', feature: 'bounce', points: [[60,427],[760,427]], thickness: 14 }],
  guideLines: [],
  stars:[{id:'ground',position:[480,404],radius:12},{id:'rise',position:[630,280],radius:12},{id:'approach',position:[665,230],radius:12}],
  exit: { id: 'exit', label: 'EXIT', x: 684, y: 145, width: 70, height: 95 },
  instructions: {
    objective: 'Reach the exit. Find a route through all three stars for full score.',
    hint: 'A bounce of 0.9 can reach the exit. For three stars, set bounce to 0.1, then send “acceleration upward 1” just before or as the ball touches the blue floor. Do not wait until the low star is collected. Gravity is another name for vertical acceleration.',
    sceneDescription: 'A geometric physics puzzle: a ball moving right drops toward a flat floor. The exit is raised on the right. The blue surface returns energy on collision. Gravity, horizontal acceleration, surface restitution and friction are editable; the ball is protected.',
    canvasHeading: 'ENERGY AT THE MOMENT OF IMPACT', readyCaption: 'ONE COLLISION. A DIFFERENT POSSIBILITY.',
    initialMessages: ['Set surface bounce to 0.9'],
    exampleMessages: ['Set surface bounce to 0.9'], suggestedMessages: ['Set surface bounce to 0.9','Set surface bounce to 0.5'],
    exampleNotice: 'Your bounce rule is queued. Send before impact, then compare another value with Try again.',
  },
};
