import type { LevelDefinition } from './types';

// Gameplay and bakery theme adapted from temp/1024-zyh (30d802f).
export const realityBreakdown: LevelDefinition = {
  id: 'reality-breakdown', number: 3, stage:3, title: 'The Last Order', presentation: 'bakery',
  viewport: { width: 960, height: 540, pixelsPerMetre: 80 },
  timeLimitSeconds: 30, initialAcceleration:[0,8], commandLimit: 100,
  environment: { restitution: .22, friction: .12 },
  ball: { id: 'energy-core', label: 'ROUND BREAD', position: [160, 407], velocity: [0, 0], radius: 13, restitution: 0 },
  tracks: [
    { id: 'factory-floor', points: [[55, 427], [495, 427]], thickness: 14 },
    { id: 'exit-floor', points: [[856, 427], [951, 427]], thickness: 14 },
  ],
  guideLines: [],
  stars:[{id:'belt',position:[300,407],radius:14},{id:'launch',position:[600,290],radius:14},{id:'airflow',position:[820,260],radius:14}],
  exit: { id: 'exit', label: 'PICKUP', x: 897, y: 213, width: 55, height: 137 },
  instructions: {
    objective: 'Run the delivery line and link the bell to the shutter.',
    hint: 'All three machines start off and the shutter is closed. Prepare conveyor speed 1.5, toaster power 2, fan power 0.45, and “When the bread touches the bell, open the shutter”. Send the four rules together from Manage, or set the toaster, fan and bell link before starting the conveyor. The toaster charges on contact; Continue resumes its first teaching pause. Reaching the bell’s dashed circle opens the shutter automatically, letting the loaf reach the paper pickup bag.',
    sceneDescription: 'A side-view bakery. The protected round bread is energy-core. belt-main is the conveyor; spring-main is the toaster; fan-main blows vertically upward; sensor-gate is the pickup bell; gate-final is the shutter. The paper bag is the exit. Only change the environment.',
    canvasHeading: 'THE LAST ORDER', readyCaption: 'YOUR RECIPES WAIT UNTIL YOU SEND.',
    exampleMessages: ['Set conveyor speed to 1.5', 'Set toaster power to 2', 'Set fan power to 0.45', 'When the bread touches the bell, open the shutter'],
    suggestedMessages: ['Set conveyor speed to 1.5', 'Set toaster power to 2', 'Set fan power to 0.45', 'When the bread touches the bell, open the shutter'],
    exampleNotice: 'Four rules are prepared, including the bell → shutter link. Manage can send them together. Otherwise prepare the fan and link before the loaf arrives; Continue resumes the first toaster charge.',
  },
  devices: [
    { kind: 'conveyor', id: 'belt-main', area: { x: 140, y: 400, width: 311, height: 25 }, speed: 0 },
    { kind: 'spring', id: 'spring-main', area: { x: 452, y: 368, width: 31, height: 58 }, power: 0, launchBase: [3, -3], launchPerPower: [.875, -1.0625], chargeSeconds: .6 },
    { kind: 'fan', id: 'fan-main', area: { x: 515, y: 130, width: 305, height: 308 }, power: 0, acceleration: [0, -4.5] },
    { kind: 'sensor', id: 'sensor-gate', position: [698, 255], radius: 56 },
    { kind: 'gate', id: 'gate-final', area: { x: 833, y: 147, width: 22, height: 273 } },
  ],
  tutorials: [{ id: 'toaster-charge', deviceId: 'spring-main', title: 'A little stored energy.', diagram: 'bakery-charge', body: 'The loaf is held while the toaster charges. Continue resumes the 0.6-second charge, then it launches up and right. Toaster power changes this launch strength; it does not change the floor’s bounce. You can prepare or change your next rule while time is paused.' }],
};
