import type { LevelDefinition } from './types';

export const downTheChimney: LevelDefinition = {
  id: 'down-the-chimney', number: 1, stage: 7, title: 'Down the Chimney',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 }, timeLimitSeconds: 30,
  initialAcceleration: [0, 0], environment: { restitution: 0, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [100, 110], velocity: [1.5, 0], radius: 16, restitution: 0 },
  tracks: [
    { id: 'left-roof', label: 'Left roof', preset: true, points: [[30, 260], [410, 260]], thickness: 12 },
    { id: 'right-roof', label: 'Right roof', preset: true, points: [[570, 260], [770, 260]], thickness: 12 },
  ], guideLines: [],
  stars: [{ id: 'begin-braking', position: [300, 110], radius: 18 }, { id: 'above-slot', position: [440, 170], radius: 24 }, { id: 'drop', position: [480, 335], radius: 20 }],
  exit: { id: 'exit', label: 'DROP HERE', x: 425, y: 430, width: 135, height: 65 },
  instructions: {
    objective: 'Brake above the opening, then drop through it.',
    hint: 'Press Start to drift. At the first star, send leftward acceleration 0.5 and downward acceleration 0.4 together. Near the middle of the opening, remove only horizontal acceleration with “acceleration rightward 0”. The downward pull continues. Keep braking too long and the ball curves back onto the roof.',
    sceneDescription: 'A protected ball drifts right at 1.5 m/s above two preset roof segments. Their opening spans x410 to570; the exit is directly below it. Stars mark the start of braking, the approach and the vertical drop. Horizontal and vertical acceleration can be edited independently. Setting rightward acceleration to zero preserves the downward component and existing velocity. All edges are open.',
    canvasHeading: 'ARRIVE ABOVE IT. FALL THROUGH IT.', readyCaption: 'BRAKE THE DRIFT, KEEP THE FALL.',
    exampleMessages: ['acceleration leftward 0.5 and acceleration downward 0.4', 'acceleration rightward 0'],
    suggestedMessages: ['acceleration leftward 0.5 and acceleration downward 0.4', 'acceleration rightward 0'],
    exampleNotice: 'Press Start first. Send the combined braking and falling rule at the first star. Remove horizontal acceleration above the opening, once the rightward drift is almost gone.',
  },
};
