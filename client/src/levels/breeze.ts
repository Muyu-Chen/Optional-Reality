import { realityBreakdown } from './reality-breakdown';
import type { LevelDefinition } from './types';

export const breeze: LevelDefinition = {
  ...realityBreakdown,id:'breeze',stage:2,title:'Catch the Breeze',tutorials:[],
  editableDevices:['fan-main'],
  devices:realityBreakdown.devices!.filter(device=>!['sensor','gate','rotor'].includes(device.kind)).map(device=>device.kind === 'conveyor' ? {...device,speed:1.5} : device.kind === 'spring' ? {...device,power:2} : device),
  instructions:{...realityBreakdown.instructions,
    objective:'Tune the updraft to keep the loaf on course.',
    hint:'The conveyor and toaster are preset; the fan starts off. Send “Set fan power to 0.45” before the loaf enters the orange dashed field. The upward push slows its fall only while it overlaps that field; outside, gravity and momentum continue. No draft drops the loaf below pickup, while a very strong draft can send it too high. Follow the stars into the paper bag marked PICKUP.',
    sceneDescription:'Bakery wind puzzle. fan-main has editable fan_power and blows vertically upward. Gravity, horizontal acceleration, surface restitution and friction are available. The conveyor speed 1.5 and toaster power 2 are preset and read-only. There is no shutter, sensor or rotor. The bread is protected. The bag is the exit.',
    canvasHeading:'THE DRAFT WORKS ONLY INSIDE ITS FIELD.',readyCaption:'THE LAUNCH IS READY. PREPARE THE AIRFLOW.',
    exampleMessages:['Set fan power to 0.45'],suggestedMessages:['Set fan power to 0.45','Set fan power to 0.6'],exampleNotice:'Fan power 0.45 is prepared. Send before the loaf enters the orange field; the conveyor and toaster are already set.',
  },
};
