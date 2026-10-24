import type { LevelDefinition } from './types';

// Gameplay adapted from the teammate's standalone prototype. Device artwork is intentionally deferred.
export const realityBreakdown: LevelDefinition = {
  id: 'reality-breakdown', number: 8, title: 'Reality Breakdown',
  viewport: { width: 960, height: 540, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialGravity: 8, commandLimit: 100, failOnFall: true, ceilingY: 100,
  environment: { restitution: .22, friction: .12 },
  ball: { id: 'energy-core', label: 'ENERGY CORE', position: [160, 407], velocity: [0, 0], radius: 13, restitution: 0 },
  tracks: [
    { id: 'factory-floor', points: [[55, 427], [495, 427]], thickness: 14 },
    { id: 'exit-floor', points: [[856, 427], [951, 427]], thickness: 14 },
  ],
  guideLines: [],
  exit: { id: 'exit', label: 'EXIT', x: 897, y: 213, width: 55, height: 137 },
  instructions: {
    objective: 'Guide the energy core into the exit',
    hint: 'Modify the factory environment. The core cannot be edited directly.',
    sceneDescription: 'Factory with conveyor, spring, fan, rotor, sensor and gate. Device visuals pending redesign.',
    canvasHeading: 'REALITY BREAKDOWN', readyCaption: 'THE CORE IS WAITING FOR YOUR RULES',
    exampleMessages: ['Set conveyor speed to 1.5', 'Set spring power to 2', 'Set fan power to 0.45', 'When the core touches the sensor, open the gate'],
    suggestedMessages: ['Set gravity to 8', 'Set platform bounce to 0.7', 'Set floor friction to 0.2'],
    exampleNotice: 'Environment rules prepared. Send the setup together to begin.',
  },
  devices: [
    { kind: 'conveyor', id: 'belt-main', area: { x: 140, y: 400, width: 311, height: 25 }, speed: 0 },
    { kind: 'spring', id: 'spring-main', area: { x: 452, y: 368, width: 31, height: 58 }, power: 0, launchBase: [3, -3], launchPerPower: [.875, -1.0625] },
    { kind: 'fan', id: 'fan-main', area: { x: 515, y: 130, width: 305, height: 308 }, power: 0, acceleration: [.35, -4.5] },
    { kind: 'rotor', id: 'rotor-main', position: [748, 180], radius: 26, angularSpeed: 0 },
    { kind: 'sensor', id: 'sensor-gate', position: [698, 255], radius: 56 },
    { kind: 'gate', id: 'gate-final', area: { x: 833, y: 147, width: 22, height: 273 } },
  ],
};
