import type { LevelDefinition } from './types';

export const returnToDock: LevelDefinition = {
  id: 'return-to-dock', number: 2, stage: 6, title: 'Return to Dock',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration: [0, 2],
  environment: { restitution: 0, friction: 0 },
  ball: { id: 'slider', label: 'SLIDING BLOCK', position: [100, 377], velocity: [2, 0], radius: 16, restitution: 0, shape: { kind: 'box', width: 32, height: 32 } },
  tracks: [
    { id: 'dock-floor', label: 'Dock floor', aliases: ['dock floor', 'floor', '地面'], feature: 'friction', points: [[40, 400], [760, 400]], thickness: 14 },
    { id: 'return-wall', label: 'Return wall', aliases: ['return wall', 'wall', '回弹墙'], feature: 'bounce', points: [[720, 240], [720, 400]], thickness: 14 },
  ],
  guideLines: [],
  stars: [
    { id: 'leave-dock', position: [280, 377], radius: 14 },
    { id: 'outbound', position: [520, 377], radius: 14 },
    { id: 'far-end', position: [665, 377], radius: 14 },
  ],
  exit: { id: 'dock', label: 'RETURN HERE', x: 140, y: 345, width: 240, height: 50, condition: { kind: 'settle', seconds: 0.75, maxSpeed: 0.12 } },
  instructions: {
    objective: 'Bounce off the far wall, then brake on the way back.',
    hint: 'Set return wall bounce to 0.9. Keep the floor slippery until the block rebounds from the right wall. Start braking with surface friction 0.3 while it is still to the right of the dock; it needs distance to slow down. Stronger braking on the outward trip can pass, but misses the far stars.',
    sceneDescription: 'A protected non-rotating block slides right on a fixed cyan friction surface toward a blue vertical return wall. The green settling dock lies behind most stars, so a full-score route visits the far wall and returns before braking. return-wall (Return wall, 回弹墙) and dock-floor (Dock floor, 地面) are independently editable. No motors or devices exist. Complete containment at at most 0.12 m/s for 0.75 seconds confirms parking. All four edges remain open.',
    canvasHeading: 'GO FAR. BOUNCE BACK. BRAKE.', readyCaption: 'SAVE THE BRAKES FOR THE RETURN.',
    exampleMessages: ['Set return wall bounce to 0.9', 'Set surface friction to 0.3'],
    suggestedMessages: ['Set return wall bounce to 0.9', 'Set surface friction to 0.3', 'Set surface friction to 0'],
    exampleNotice: 'Send the wall bounce first. Wait for the rebound, then brake before the block reaches the dock.',
  },
};
