import { realityBreakdown } from './reality-breakdown';
import type { LevelDefinition } from './types';

// Device lesson: transport and airflow are preset; baseline physics stays available.
export const toaster: LevelDefinition = {
  ...realityBreakdown,id:'toaster',stage:1,title:'A Little Stored Energy',
  editableDevices:['spring-main'],
  devices:realityBreakdown.devices!.filter(device=>!['sensor','gate','rotor'].includes(device.kind)).map(device=>device.kind === 'conveyor' ? {...device,speed:1.5} : device.kind === 'fan' ? {...device,power:.45} : device),
  instructions:{...realityBreakdown.instructions,
    objective:'Use the toaster to launch the loaf to pickup',
    hint:'The conveyor and airflow are already running. Give the toaster some power; watch it store and release energy.',
    sceneDescription:'Bakery tutorial. The toaster is spring-main with editable spring_power. Gravity, horizontal acceleration, surface restitution and friction are available. The conveyor speed 1.5 and upward fan power 0.45 are preset and read-only. There is no shutter, sensor or rotor. The bread is protected. The bag is the exit.',
    exampleMessages:['Set toaster power to 2'],suggestedMessages:['Set toaster power to 2'],exampleNotice:'Try changing the toaster first. Other environment rules are available too.',
  },
};
