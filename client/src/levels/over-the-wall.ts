import type { LevelDefinition } from './types';

export const overTheWall: LevelDefinition = {
  id: 'over-the-wall', number: 1, stage: 4, title: 'Over the Wall',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration: [0, 0],
  environment: { restitution: 0, friction: 0 },
  ball: { id: 'ball-A', label: 'BALL A', position: [100, 360], velocity: [0.8, 0], radius: 16, restitution: 0 },
  tracks: [{ id: 'wall', label: 'Wall', preset: true, points: [[300, 510], [300, 330], [540, 330], [540, 510]], thickness: 12 }],
  guideLines: [],
  stars: [
    { id: 'lift', position: [230, 327], radius: 22 },
    { id: 'crest', position: [420, 218], radius: 24 },
    { id: 'descent', position: [575, 216], radius: 26 },
  ],
  exit: { id: 'exit', label: 'EXIT', x: 690, y: 240, width: 65, height: 120 },
  instructions: {
    objective: 'Lift over the wall, then bend back toward the exit.',
    hint: 'Send “acceleration upward 0.2” to lift the moving ball. As it passes over the wall’s left edge, send “reverse gravity”. Downward acceleration first slows the climb, then bends the flight down toward the exit.',
    sceneDescription: 'A protected ball drifts right in zero gravity toward a tall fixed wall with a flat top. Stars trace an arch above the wall. Upward acceleration creates lift; reversing vertical acceleration above the left edge brakes the climb without changing horizontal momentum. The wall is preset. All environment rules remain editable and all four edges are open.',
    canvasHeading: 'DRAW AN ARCH WITH TWO RULES.', readyCaption: 'UP, OVER, AND DOWN.',
    exampleMessages: ['acceleration upward 0.2', 'reverse gravity'],
    suggestedMessages: ['acceleration upward 0.2', 'reverse gravity', 'stop gravity'],
    exampleNotice: 'Send upward acceleration to begin. Reverse gravity over the left edge of the wall; momentum will keep carrying the ball upward for a while.',
  },
};
