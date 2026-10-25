import type { DeviceDefinition, LevelDefinition, Point } from './types';

const number = (value: number) => String(Number(value.toFixed(3)));

function vector([x, y]: Point, unit: string) {
  if (!x && !y) return '0';
  if (x && y) return `${x > 0 ? 'Right' : 'Left'} ${number(Math.abs(x))}, ${y > 0 ? 'down' : 'up'} ${number(Math.abs(y))} ${unit}`;
  return `${x ? x > 0 ? 'Right' : 'Left' : y > 0 ? 'Down' : 'Up'} · ${number(Math.abs(x || y))} ${unit}`;
}

function deviceState(device: DeviceDefinition, bakery: boolean): string {
  switch (device.kind) {
    case 'conveyor': return device.speed ? `Conveyor ${vector([device.speed, 0], 'm/s')}` : 'Conveyor stopped';
    case 'spring': return `${bakery ? 'Toaster' : 'Spring'} ${device.power ? `ready · power ${number(device.power)}` : 'off'}`;
    case 'fan': return device.power ? `Fan ${vector([device.acceleration[0] * device.power, device.acceleration[1] * device.power], 'm/s²')}` : 'Fan off';
    case 'rotor': return device.angularSpeed ? `Wheel ${number(device.angularSpeed)} rad/s` : 'Wheel stopped';
    case 'sensor': return 'Bell waiting';
    case 'gate': return 'Shutter closed';
  }
}

/** Describe the untouched level, never a prepared message or a running snapshot. */
export function initialStateSummary(level: LevelDefinition) {
  const defaults = level.environment ?? { restitution: 0, friction: 0 };
  const materials = level.tracks.filter(track => !track.preset).map(track => ({
    name: track.label || 'Surface',
    bounce: track.material?.restitution ?? defaults.restitution,
    friction: track.material?.friction ?? defaults.friction,
  }));
  const uniform = materials.every(material => material.bounce === materials[0]?.bounce && material.friction === materials[0]?.friction);
  const surfaces = (uniform && materials.length ? [{ ...materials[0], name: 'Surfaces' }] : materials)
    .map(material => `${material.name} · bounce ${number(material.bounce)} · friction ${number(material.friction)}`);
  const moving = level.ball.velocity.some(value => value !== 0);
  return {
    actor: level.presentation === 'bakery' ? 'Bread' : level.ball.shape?.kind === 'box' ? 'Block' : 'Ball',
    motion: moving ? vector(level.ball.velocity, 'm/s') : 'At rest',
    acceleration: level.initialAcceleration.some(value => value !== 0) ? vector(level.initialAcceleration, 'm/s²') : 'None · 0 m/s²',
    surfaces,
    devices: (level.devices ?? []).map(device => deviceState(device, level.presentation === 'bakery')),
  };
}
