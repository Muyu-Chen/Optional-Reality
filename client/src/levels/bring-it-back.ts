import type { LevelDefinition } from './types';

export const bringItBack: LevelDefinition = {
  id: 'bring-it-back', number: 1, stage: 3, title: 'Bring It Back',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration: [0, 0],
  environment: { restitution: 0, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [180, 260], velocity: [2, 0], radius: 16, restitution: 0 },
  tracks: [], guideLines: [],
  stars: [
    { id: 'outbound', position: [330, 260], radius: 14 },
    { id: 'keep-going', position: [500, 260], radius: 14 },
    { id: 'turnaround', position: [650, 260], radius: 14 },
  ],
  exit: { id: 'exit', label: 'COME BACK', x: 55, y: 220, width: 65, height: 80 },
  instructions: {
    objective: 'Visit the far star, then come back to the exit.',
    hint: 'Press Start to release the rightward drift. Near the middle star, send “acceleration leftward 1”. It keeps moving right while slowing down, then turns back. Sending too early misses the far star; too late sends it out of bounds.',
    sceneDescription: 'A zero-gravity out-and-back puzzle with no collision surfaces. A protected ball starts drifting right at 2 m/s. Three stars extend to the right; the exit is behind the starting point on the left. Leftward acceleration brakes existing rightward motion before reversing it. All environment rules remain editable; all four edges are open.',
    canvasHeading: 'BRAKE FIRST. TURN LATER.', readyCaption: 'THE EXIT IS BEHIND YOU.',
    exampleMessages: ['acceleration leftward 1'],
    suggestedMessages: ['acceleration leftward 1', 'stop gravity', 'acceleration rightward 1'],
    exampleNotice: 'Press Start to begin drifting; your queued rule waits. Send leftward acceleration near the middle star and watch momentum carry the ball onward before it returns.',
  },
};
