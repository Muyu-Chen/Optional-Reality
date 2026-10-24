/** Draft data-only schema based on the repository's LevelDefinition contract.
 * This is a PROPOSAL, not a runtime feature already supported by PhysicsWorld.
 * The core can never be targeted by a user rule.
 */
import type { LevelDefinition, Point } from '../../client/src/levels/types';

type Device =
  | { readonly kind: 'conveyor'; readonly id: string; readonly x: number; readonly y: number; readonly width: number; readonly speed: number; readonly editable: true }
  | { readonly kind: 'spring'; readonly id: string; readonly position: Point; readonly launchPower: number; readonly editable: true }
  | { readonly kind: 'fan'; readonly id: string; readonly area: { x: number; y: number; width: number; height: number }; readonly power: number; readonly editable: true }
  | { readonly kind: 'rotor'; readonly id: string; readonly position: Point; readonly radius: number; readonly angularSpeed: number; readonly editable: true }
  | { readonly kind: 'sensor'; readonly id: string; readonly position: Point; readonly radius: number; readonly editable: false }
  | { readonly kind: 'gate'; readonly id: string; readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly editable: false };

export interface ExperimentalLevelEight extends LevelDefinition {
  readonly devices: readonly Device[];
  readonly permittedRuleTypes: readonly ['gravity', 'elasticity', 'friction', 'conveyor', 'spring', 'wind', 'rotation', 'sensor_gate'];
  readonly commandLimit: number;
}

export const realityBreakdownDesign: ExperimentalLevelEight = {
  id: 'reality-breakdown',
  number: 8,
  title: 'Reality Breakdown',
  viewport: { width: 960, height: 540, pixelsPerMetre: 80 },
  timeLimitSeconds: 24,
  initialGravity: 1,
  ball: { id: 'energy-core', label: 'ENERGY CORE', position: [160, 407], velocity: [0, 0], radius: 13, restitution: 0.22 },
  tracks: [
    { id: 'factory-floor', points: [[55, 420], [495, 420]], thickness: 14 },
    { id: 'exit-floor', points: [[856, 420], [951, 420]], thickness: 14 },
  ],
  guideLines: [],
  exit: { id: 'exit', label: 'EXIT', x: 897, y: 213, width: 55, height: 137 },
  instructions: {
    objective: 'Send the energy core into the EXIT by modifying the factory environment',
    hint: 'Speed up the conveyor, charge the spring, tune the fan, then add a rule linking the sensor to the gate.',
    sceneDescription: 'Side-view factory with conveyor, spring, fan, rotary wheel, a sensor, a gate and an exit.',
    canvasHeading: 'REALITY BREAKDOWN',
    readyCaption: 'THE CORE IS WAITING FOR YOUR RULES',
    exampleMessages: ['Set conveyor speed to 1.5', 'Set spring power to 2', 'Set fan power to 0.45', 'When the core touches the sensor, open the gate'],
    suggestedMessages: ['Set gravity to 1', 'Make the wheel spin clockwise at speed 1'],
    exampleNotice: 'Apply environment rules, then start and replay the simulation.',
  },
  commandLimit: 100,
  permittedRuleTypes: ['gravity', 'elasticity', 'friction', 'conveyor', 'spring', 'wind', 'rotation', 'sensor_gate'],
  devices: [
    { kind: 'conveyor', id: 'belt-main', x: 140, y: 411, width: 311, speed: 0, editable: true },
    { kind: 'spring', id: 'spring-main', position: [459, 392], launchPower: 0, editable: true },
    { kind: 'fan', id: 'fan-main', area: { x: 515, y: 130, width: 305, height: 308 }, power: 0, editable: true },
    { kind: 'rotor', id: 'rotor-main', position: [748, 180], radius: 26, angularSpeed: 0, editable: true },
    { kind: 'sensor', id: 'sensor-gate', position: [698, 255], radius: 56, editable: false },
    { kind: 'gate', id: 'gate-final', x: 833, y: 147, width: 22, height: 273, editable: false },
  ],
};
