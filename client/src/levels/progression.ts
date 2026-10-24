import type { PropertyName } from '../../../shared/rules';
import type { LevelDefinition } from './types';

export interface TierDefinition {
  number: number; title: string; lesson: string;
  worldProperties: readonly PropertyName[];
  devices: readonly string[];
  apparatus: readonly string[];
}
export const tiers: readonly TierDefinition[] = [
  {number:1,title:'Motion',lesson:'Gravity, momentum and when to send.',worldProperties:['gravity'],devices:[],apparatus:['Ball','Ramp','Static walls','Exit']},
  {number:2,title:'Collisions',lesson:'How surfaces change a collision.',worldProperties:['gravity','restitution','friction'],devices:[],apparatus:['Ball','Ramp','Walls','Bounce surface','Friction surface','Exit']},
  {number:3,title:'Devices',lesson:'Learn one device, then combine familiar ones.',worldProperties:['gravity','restitution','friction'],devices:['spring','fan','conveyor','sensor','gate'],apparatus:['Toaster / spring','Updraft fan','Conveyor','Sensor + gate']},
];
export const tierFor = (level: LevelDefinition) => tiers.find(tier=>tier.number===level.number);
export const levelLabel = (level: LevelDefinition) => `${String(level.number).padStart(2,'0')}${level.stage ? '.'+level.stage : ''}`;
