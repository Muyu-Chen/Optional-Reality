import { realityBreakdown } from './reality-breakdown';
import type { LevelDefinition } from './types';

export const breeze: LevelDefinition = {
  ...realityBreakdown,id:'breeze',stage:2,title:'Catch the Breeze',tutorials:[],
  editableDevices:['fan-main'],
  devices:realityBreakdown.devices!.filter(device=>!['sensor','gate','rotor'].includes(device.kind)).map(device=>device.kind === 'conveyor' ? {...device,speed:1.5} : device.kind === 'spring' ? {...device,power:2} : device),
  instructions:{...realityBreakdown.instructions,
    objective:'Use the updraft to carry the loaf to pickup',
    hint:'The conveyor and toaster are ready. Give the fan a gentle upward draft before the loaf enters its field.',
    sceneDescription:'Bakery wind puzzle. fan-main has editable fan_power and blows vertically upward. Gravity, horizontal acceleration, surface restitution and friction are available. The conveyor speed 1.5 and toaster power 2 are preset and read-only. There is no shutter, sensor or rotor. The bread is protected. The bag is the exit.',
    exampleMessages:['Set fan power to 0.45'],suggestedMessages:['Set fan power to 0.45','Set fan power to 0.6'],exampleNotice:'Fan power is queued. Send it, then watch the upward field.',
  },
};
