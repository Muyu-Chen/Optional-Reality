import type { LevelDefinition } from './types';

export const lowRoof: LevelDefinition = {
  id: 'low-roof', number: 2, stage: 9, title: 'Low Roof',
  viewport: { width: 800, height: 510, pixelsPerMetre: 80 }, timeLimitSeconds: 30,
  initialAcceleration: [0, 2], environment: { restitution: 0.1, friction: 0 },
  ball: { id: 'slider', label: 'BOUNCING BLOCK', position: [100, 100], velocity: [1.4, 0], radius: 14, restitution: 0, shape: { kind: 'box', width: 28, height: 28 } },
  tracks: [
    { id: 'launch-pad', label: 'Launch pad', aliases: ['launch pad', '发射板'], feature: 'bounce', points: [[40, 427], [420, 427]], thickness: 14 },
    { id: 'landing-floor', label: 'Landing floor', aliases: ['landing floor', '着陆地面'], feature: 'friction', points: [[440, 427], [760, 427]], thickness: 14 },
    { id: 'roof', label: 'Low roof', preset: true, material: { restitution: 0, friction: 0 }, points: [[380, 200], [680, 200]], thickness: 14 },
  ], guideLines: [],
  stars: [{ id: 'fall', position: [260, 290], radius: 22 }, { id: 'roof-contact', position: [410, 235], radius: 22 }, { id: 'catch', position: [570, 385], radius: 22 }],
  exit: { id: 'landing-bay', label: 'SOFT LANDING', x: 480, y: 370, width: 240, height: 50, condition: { kind: 'settle', seconds: 0.8, maxSpeed: 0.15 } },
  instructions: {
    objective: 'Rebound into the low roof, then catch the falling block.',
    hint: 'Give the launch pad bounce 0.9. Make the landing floor soft and grippy: bounce 0 and friction 0.3. The gray roof absorbs the upward motion, but the block keeps moving right. Prepare all three rules before the first bounce, then watch both collisions.',
    sceneDescription: 'A protected non-rotating block falls rightward onto an editable launch-pad. A low preset roof with zero bounce and friction interrupts the rebound, removing upward motion while preserving rightward motion. The block then drops onto landing-floor, a separately editable receiver. The green bay requires complete containment below 0.15 m/s for 0.8 seconds. Launch pad and landing floor support named local material rules; general rules change both. Roof is read-only; all edges open.',
    canvasHeading: 'THE CEILING IS PART OF THE ROUTE.', readyCaption: 'BOUNCE. TAP THE ROOF. LAND SOFTLY.',
    exampleMessages: ['Set launch pad bounce to 0.9', 'Set landing floor bounce to 0', 'Set landing floor friction to 0.3'],
    suggestedMessages: ['Set launch pad bounce to 0.9', 'Set landing floor bounce to 0', 'Set landing floor friction to 0.3'],
    exampleNotice: 'These are three local surface rules. Send all before the first bounce; the gray roof already has the right material.',
  },
};
