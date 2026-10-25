import type { LevelDefinition } from './types';

export const mindTheGap: LevelDefinition = {
  id: 'mind-the-gap', number: 2, stage: 10, title: 'Mind the Gap',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 }, timeLimitSeconds: 30,
  initialAcceleration: [0, 2], environment: { restitution: 0, friction: 0.3 },
  ball: { id: 'slider', label: 'SLIDING BLOCK', position: [100, 339], velocity: [0, 0], radius: 14, restitution: 0, shape: { kind: 'box', width: 28, height: 28 } },
  tracks: [
    { id: 'runway', label: 'Runway', aliases: ['runway', '跑道'], feature: 'friction', points: [[40, 360], [320, 360]], thickness: 14 },
    { id: 'landing-floor', label: 'Landing floor', aliases: ['landing floor', '着陆地面'], feature: 'friction', points: [[480, 427], [760, 427]], thickness: 14 },
  ], guideLines: [],
  stars: [{ id: 'run-up', position: [260, 339], radius: 18 }, { id: 'leap', position: [400, 356], radius: 22 }, { id: 'landing', position: [530, 405], radius: 22 }],
  exit: { id: 'parking-bay', label: 'PARK AFTER THE GAP', x: 500, y: 370, width: 220, height: 50, condition: { kind: 'settle', seconds: 0.8, maxSpeed: 0.15 } },
  instructions: {
    objective: 'Build speed, coast across the break, then park.',
    hint: 'Make surfaces slippery and accelerate rightward 0.8. At the runway’s edge, remove horizontal acceleration. Prepare landing-floor friction 0.3 before touchdown: it only slows the block once contact occurs, then needs room to stop inside the green bay. Braking on the runway leaves you short, while keeping the rightward pull can prevent parking.',
    sceneDescription: 'A protected non-rotating block starts at rest on an editable raised runway. A 160px gap separates it from a lower landing-floor and a green settling bay. Rightward acceleration builds speed on a slippery runway; removing that acceleration at the edge preserves momentum for the jump. Local friction on landing-floor acts only after landing. Complete containment below 0.15 m/s for 0.8 seconds confirms parking. No motors or other devices; environment and surface rules editable; all edges open.',
    canvasHeading: 'ACCELERATE HERE. BRAKE OVER THERE.', readyCaption: 'LET MOMENTUM CROSS THE GAP.',
    exampleMessages: ['Set surface friction to 0 and acceleration rightward 0.8', 'acceleration rightward 0', 'Set landing floor friction to 0.3'],
    suggestedMessages: ['Set surface friction to 0 and acceleration rightward 0.8', 'acceleration rightward 0', 'Set landing floor friction to 0.3'],
    exampleNotice: 'Send the run-up rule first, remove horizontal acceleration at the upper runway’s edge, then set landing-floor friction before touchdown. Send the three messages separately.',
  },
};
