import { realityBreakdown } from './reality-breakdown';
import type { LevelDefinition } from './types';

// Device lesson: transport and airflow are preset; baseline physics stays available.
export const toaster: LevelDefinition = {
  ...realityBreakdown,id:'toaster',stage:1,title:'A Little Stored Energy',
  editableDevices:['spring-main'],
  devices:realityBreakdown.devices!.filter(device=>!['sensor','gate','rotor'].includes(device.kind)).map(device=>device.kind === 'conveyor' ? {...device,speed:1.5} : device.kind === 'fan' ? {...device,power:.45} : device),
  instructions:{...realityBreakdown.instructions,
    objective:'Power the toaster; the conveyor and fan are ready.',
    hint:'The conveyor moves the loaf right and the fan is already on. Send “Set toaster power to 2” before the loaf reaches the blue toaster. Contact starts a 0.6-second charge, then a launch up and right. The first contact pauses for an explanation: choose Continue to resume charging. The orange draft helps the loaf reach the paper bag marked PICKUP. If it falls short, try more toaster power; too much can overshoot.',
    sceneDescription:'Bakery tutorial. The toaster is spring-main with editable spring_power (launch strength). Colloquial requests to increase its elasticity, bounce, 弹性 or 弹力 mean stronger launch power on spring-main, not global surface restitution. Gravity, horizontal acceleration, surface restitution and friction are available. The conveyor speed 1.5 and upward fan power 0.45 are preset and read-only. There is no shutter, sensor or rotor. The bread is protected. The bag is the exit.',
    canvasHeading:'CONTACT → CHARGE → LAUNCH',readyCaption:'THE BELT AND FAN ARE READY. POWER THE TOASTER.',
    exampleMessages:['Set toaster power to 2'],suggestedMessages:['Set toaster power to 2'],exampleNotice:'Toaster power 2 is prepared. Send it before contact. At the first charging pause, choose Continue; the conveyor and fan need no changes.',
  },
};
