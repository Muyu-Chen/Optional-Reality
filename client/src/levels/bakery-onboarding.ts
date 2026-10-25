import type { LevelOnboarding } from './onboarding';
import type { LevelDefinition } from './types';
import { toaster } from './toaster';
import { breeze } from './breeze';
import { realityBreakdown } from './reality-breakdown';

function machineSetup(level: LevelDefinition): NonNullable<LevelOnboarding['machines']> {
  const machines = (level.devices || []).flatMap(device => {
    if (device.kind !== 'conveyor' && device.kind !== 'spring' && device.kind !== 'fan') return [];
    const value = device.kind === 'conveyor' ? device.speed : device.power;
    return [{ name: device.kind === 'spring' ? 'Toaster' : device.kind === 'fan' ? 'Fan' : 'Conveyor',
      state: value === 0 ? 'Starts off' : `${device.kind === 'conveyor' ? 'Drive' : 'Power'} ${value}`,
      editable: !level.editableDevices || level.editableDevices.includes(device.id) }];
  });
  if (level.devices?.some(device => device.kind === 'sensor')) machines.push({ name: 'Bell → shutter', state: 'Link required', editable: true });
  return machines;
}

/** Diagrams and instructions share the actual setup and queue examples. */
export const bakeryLessons: Readonly<Record<string, LevelOnboarding>> = {
  toaster: {
    theme: 'bakery', title: 'A little energy goes a long way.',
    intro: 'The loaf rides a conveyor into the blue toaster, then flies through an orange updraft to the paper bag marked PICKUP. This lesson puts you in charge of the launch.',
    machines: machineSetup(toaster), starterLabel: 'Load toaster setup',
    steps: [
      { title: 'Give the toaster power', diagram: 'bakery-setup', commands: toaster.instructions.exampleMessages,
        body: 'Send this before the loaf reaches the toaster. The conveyor and fan are already running. Toaster power controls the launch strength; changing surface bounce controls collisions instead.' },
      { title: 'Contact, charge, launch', diagram: 'bakery-charge',
        body: 'Touching the toaster holds the loaf for a 0.6-second charge. The first contact pauses the game to explain it. Choose Continue to resume charging and launch up and right.' },
      { title: 'Follow the delivery route', diagram: 'bakery-delivery',
        body: 'The preset fan helps the airborne loaf stay high enough to reach pickup. Follow the three stars into the paper bag marked EXIT. You do not need to send a separate release command.' },
    ],
    watchFor: { title: 'Short of the bag?', body: 'Try a stronger launch. If the loaf sails past the route, reduce toaster power. Try again restores the starting world and keeps your prepared message.' },
  },
  breeze: {
    theme: 'bakery', title: 'Keep the loaf in the air.',
    intro: 'The conveyor and toaster are preset. First toaster contact pauses for an explanation; Continue resumes the charge. Your fan adds an upward push inside the orange dashed field, helping the launched loaf reach pickup.',
    machines: machineSetup(breeze), starterLabel: 'Load fan setup',
    steps: [
      { title: 'Find the airflow field', diagram: 'bakery-field',
        body: 'The orange dashed rectangle marks the fan’s reach. Its force acts only while the loaf overlaps this area. It does not change gravity across the whole bakery.' },
      { title: 'Prepare a gentle updraft', diagram: 'bakery-draft', commands: breeze.instructions.exampleMessages,
        body: 'Send before the loaf enters the field; setting it before takeoff also works. The upward push slows the fall while momentum still carries the loaf right.' },
      { title: 'Aim through the stars', diagram: 'bakery-delivery',
        body: 'Watch the height near the last star and pickup bag. A weaker draft brings the route lower; a stronger draft keeps it higher. Reaching pickup passes, and all three stars earn full score.' },
    ],
    watchFor: { title: 'Too low or too high?', body: 'With the fan off, the loaf falls below pickup. Start with 0.45; a very strong draft can send it above the bag. Compare strengths with Try again.' },
  },
  'reality-breakdown': {
    theme: 'bakery', title: 'Prepare the whole delivery line.',
    intro: 'All three machines start off and the shutter is closed. Combine the launch and updraft you learned, then teach the bell to open the way to pickup.',
    machines: machineSetup(realityBreakdown), starterLabel: 'Load delivery setup',
    steps: [
      { title: 'Move, then launch', diagram: 'bakery-setup', commands: realityBreakdown.instructions.exampleMessages.slice(0, 2),
        body: 'The conveyor carries the loaf right into the toaster. Contact starts its charge, then a launch up and right. Continue resumes the first charging pause.' },
      { title: 'Support the flight', diagram: 'bakery-field', commands: realityBreakdown.instructions.exampleMessages.slice(2, 3),
        body: 'The fan slows the fall inside the orange field. Prepare it before the loaf arrives so the flight stays near the high stars and pickup bell.' },
      { title: 'Link the bell to the shutter', diagram: 'bakery-bell', commands: realityBreakdown.instructions.exampleMessages.slice(3),
        body: 'Send this rule before the loaf reaches the bell’s dashed circle. The rule waits for contact; then the shutter opens automatically and stays open for delivery.' },
    ],
    watchFor: { title: 'A simple first attempt', body: 'Load all four messages, then use Manage to send them together. For separate sends, set the toaster, fan and bell link before starting the conveyor. Without the link, the shutter stays closed even if the loaf reaches the bell.' },
  },
};
