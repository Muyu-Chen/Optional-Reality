import type { LevelDefinition } from './types';

export const threadTheGap: LevelDefinition = {
  id: 'thread-the-gap', number: 1, stage: 6, title: 'Thread the Gap',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 }, timeLimitSeconds: 30,
  initialAcceleration: [0, 0], environment: { restitution: 0, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [100, 400], velocity: [1.5, 0], radius: 16, restitution: 0 },
  tracks: [
    { id: 'upper-wall', label: 'Upper wall', preset: true, points: [[610, 0], [610, 220]], thickness: 12 },
    { id: 'lower-wall', label: 'Lower wall', preset: true, points: [[610, 325], [610, 510]], thickness: 12 },
  ], guideLines: [],
  stars: [{ id: 'lift', position: [280, 364], radius: 20 }, { id: 'brake', position: [450, 290], radius: 22 }, { id: 'gap', position: [610, 272], radius: 18 }],
  exit: { id: 'exit', label: 'COAST THROUGH', x: 710, y: 230, width: 65, height: 85 },
  instructions: {
    objective: 'Lift, brake the climb, then coast through the opening.',
    hint: 'Send upward acceleration 0.4. Around x = 340, reverse gravity to slow the climb. Near x = 580, when the path levels out, stop gravity. Removing acceleration keeps the velocity you already have; it does not stop the ball.',
    sceneDescription: 'A protected ball drifts right at 1.5 m/s in zero gravity. Two preset vertical wall segments leave a central opening from y220 to325. Stars trace a rising route that levels off before the opening. Upward acceleration, downward braking and then zero vertical acceleration produce a flat approach. Only environment rules are editable; the walls and ball stay fixed. All edges are open.',
    canvasHeading: 'LIFT. BRAKE. COAST.', readyCaption: 'ZERO ACCELERATION IS NOT ZERO SPEED.',
    exampleMessages: ['acceleration upward 0.4', 'reverse gravity', 'stop gravity'],
    suggestedMessages: ['acceleration upward 0.4', 'reverse gravity', 'stop gravity'],
    exampleNotice: 'Send upward acceleration first. Reverse near x340; stop gravity near x580. Send the messages separately as the ball reaches each part of the route.',
  },
};
