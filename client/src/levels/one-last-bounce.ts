import type { LevelDefinition } from './types';

export const oneLastBounce: LevelDefinition = {
  id: 'one-last-bounce', number: 2, stage: 7, title: 'One Last Bounce',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration: [0, 2],
  environment: { restitution: 0.1, friction: 0 },
  ball: { id: 'slider', label: 'BOUNCING BLOCK', position: [100, 130], velocity: [1, 0], radius: 14, restitution: 0, shape: { kind: 'box', width: 28, height: 28 } },
  tracks: [{ id: 'shared-floor', label: 'Shared floor', aliases: ['shared floor', 'floor', '地面'], feature: 'bounce', points: [[40, 427], [760, 427]], thickness: 14 }],
  guideLines: [],
  stars: [
    { id: 'first-landing', position: [240, 380], radius: 14 },
    { id: 'high-arc', position: [380, 182], radius: 16 },
    { id: 'last-landing', position: [500, 350], radius: 16 },
  ],
  exit: { id: 'landing-bay', label: 'LAND HERE', x: 470, y: 370, width: 210, height: 50, condition: { kind: 'settle', seconds: 0.8, maxSpeed: 0.15 } },
  instructions: {
    objective: 'Use one strong bounce, then turn the same floor into a soft landing.',
    hint: 'Start with surface bounce 0.9. After the first rebound, set surface bounce to 0 and surface friction to 0.3. Those changes do not alter the block in midair; they absorb its next landing inside the green bay.',
    sceneDescription: 'A protected non-rotating block falls rightward onto one continuous editable blue floor. The first landing lies left of the green settling bay. High restitution launches it through the high star; changing that same floor to zero restitution and positive friction while airborne catches the second landing. There are no separate launch and receiver surfaces, no devices, and no direct velocity edits. The whole block must remain inside the bay at at most 0.15 m/s for 0.8 seconds. Environment acceleration, surface friction and restitution remain editable; all four edges are open.',
    canvasHeading: 'ONE SURFACE. TWO DIFFERENT JOBS.', readyCaption: 'MAKE THE NEXT LANDING THE LAST.',
    exampleMessages: ['Set surface bounce to 0.9', 'Set surface bounce to 0 and surface friction to 0.3'],
    suggestedMessages: ['Set surface bounce to 0.9', 'Set surface bounce to 0 and surface friction to 0.3'],
    exampleNotice: 'Send high bounce to begin. After the block rebounds, send the soft, grippy landing rule before it touches the floor again.',
  },
};
