import type { LevelDefinition } from './types';

// Gameplay and bakery theme adapted from temp/1024-zyh (30d802f).
export const realityBreakdown: LevelDefinition = {
  id: 'reality-breakdown', number: 8, title: 'The Corner Bakery', presentation: 'bakery',
  viewport: { width: 960, height: 540, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialGravity: 8, commandLimit: 100, failOnFall: true, ceilingY: 100,
  environment: { restitution: .22, friction: .12 },
  ball: { id: 'energy-core', label: 'ROUND BREAD', position: [160, 407], velocity: [0, 0], radius: 13, restitution: 0 },
  tracks: [
    { id: 'factory-floor', points: [[55, 427], [495, 427]], thickness: 14 },
    { id: 'exit-floor', points: [[856, 427], [951, 427]], thickness: 14 },
  ],
  guideLines: [],
  exit: { id: 'exit', label: 'PICKUP', x: 897, y: 213, width: 55, height: 137 },
  instructions: {
    objective: 'Deliver the last loaf to the pickup bag',
    hint: 'Prepare the conveyor, toaster and fan. Link the bell to the shutter, then choose when to send.',
    sceneDescription: 'A side-view bakery. The protected round bread is energy-core. belt-main is the conveyor; spring-main is the toaster; fan-main blows vertically upward; rotor-main is the ventilation wheel; sensor-gate is the pickup bell; gate-final is the shutter. The paper bag is the exit. Only change the environment.',
    canvasHeading: 'THE LAST ORDER', readyCaption: 'YOUR RECIPES WAIT UNTIL YOU SEND.',
    exampleMessages: ['Set conveyor speed to 1.5', 'Set spring power to 2', 'Set fan power to 0.45', 'When the core touches the sensor, open the gate'],
    suggestedMessages: ['Set conveyor speed to 1.5', 'Set spring power to 2', 'Set fan power to 0.45'],
    exampleNotice: 'Setup loaded. Select all four messages to send together, or send them at different moments. Retry keeps the rules.',
  },
  devices: [
    { kind: 'conveyor', id: 'belt-main', area: { x: 140, y: 400, width: 311, height: 25 }, speed: 0 },
    { kind: 'spring', id: 'spring-main', area: { x: 452, y: 368, width: 31, height: 58 }, power: 0, launchBase: [3, -3], launchPerPower: [.875, -1.0625] },
    { kind: 'fan', id: 'fan-main', area: { x: 515, y: 130, width: 305, height: 308 }, power: 0, acceleration: [0, -4.5] },
    { kind: 'rotor', id: 'rotor-main', position: [748, 180], radius: 26, angularSpeed: 0 },
    { kind: 'sensor', id: 'sensor-gate', position: [698, 255], radius: 56 },
    { kind: 'gate', id: 'gate-final', area: { x: 833, y: 147, width: 22, height: 273 } },
  ],
};
