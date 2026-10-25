import type { LevelDefinition } from './types';

export const bankShot: LevelDefinition = {
  id: 'bank-shot', number: 2, stage: 1, title: 'Bank Shot',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration: [0, 0],
  environment: { restitution: 0.1, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [100, 350], velocity: [3, 0], radius: 16, restitution: 0 },
  tracks: [{ id: 'bank', label: 'Bank', aliases: ['bank', 'angled pad', '斜板'], feature: 'bounce', points: [[460, 470], [700, 230]], thickness: 12 }],
  guideLines: [],
  stars: [
    { id: 'approach', position: [300, 350], radius: 14 },
    { id: 'deflection', position: [550, 295], radius: 16 },
    { id: 'rise', position: [560, 180], radius: 16 },
  ],
  exit: { id: 'exit', label: 'EXIT', x: 520, y: 60, width: 100, height: 75 },
  instructions: {
    objective: 'Use the angled surface to turn rightward motion upward.',
    hint: 'Try “Set surface bounce to 1” before impact. The slanted blue bank turns the ball upward even with gravity off. Compare a weaker bounce: it changes the outgoing direction as well as the speed.',
    sceneDescription: 'A zero-gravity collision puzzle. A protected ball travels right toward a 45-degree blue bank, with an exit above the impact point. Editable surface restitution controls the reflected normal velocity; friction and both acceleration components remain editable. Stars follow the incoming horizontal and outgoing upward routes. All four play-area edges are open.',
    canvasHeading: 'A NEW DIRECTION AT IMPACT.', readyCaption: 'THE ANGLE DOES THE TURNING.',
    exampleMessages: ['Set surface bounce to 1'],
    initialMessages: ['Set surface bounce to 1'],
    suggestedMessages: ['Set surface bounce to 1', 'Set surface bounce to 0.5', 'Set bank friction to 0'],
    exampleNotice: 'Make the blue bank bouncy before contact. Watch it redirect the ball without an upward acceleration rule.',
  },
};
