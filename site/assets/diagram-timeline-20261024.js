export const springModel = Object.freeze({
  step: 1 / 480, radius: 17, restTop: 239, initialY: 100, starY: 174,
  gravity: 150, stiffness: 40, damping: .35,
});
const { step: dt, radius, restTop: springTop, initialY: startY, starY } = springModel;
const events = { gravityAdded: 1.6 };
const compressionAt = y => Math.max(0, y + radius - springTop);
// Unilateral contact: the cap can push the ball, never pull it back down.
const forceAt = (y, velocity) => compressionAt(y) > 0
  ? Math.max(0, springModel.stiffness * compressionAt(y) + springModel.damping * velocity) : 0;
const accelerationAt = (y, velocity, gravity) => gravity - forceAt(y, velocity);
let y = startY;
let velocity = 0;
const states = [{ y, velocity }];
const crossingTime = (time, previous, next, target) => time + dt * (target - previous) / (next - previous);

// A passive Hooke spring with slight damping, integrated by RK4. There is no hold,
// launch velocity, time-based compression curve or extra stored energy at rest.
for (let tick = 0; tick < 480 * 18; tick++) {
  const time = tick * dt;
  const previousY = y, previousVelocity = velocity;
  const reversed = events.prompt !== undefined && time >= events.prompt + .45;
  const gravity = time < events.gravityAdded ? 0 : reversed ? -springModel.gravity : springModel.gravity;
  if (reversed) events.reversed ??= time;
  const a1 = accelerationAt(y, velocity, gravity);
  const v2 = velocity + a1 * dt / 2;
  const a2 = accelerationAt(y + velocity * dt / 2, v2, gravity);
  const v3 = velocity + a2 * dt / 2;
  const a3 = accelerationAt(y + v2 * dt / 2, v3, gravity);
  const v4 = velocity + a3 * dt;
  const a4 = accelerationAt(y + v3 * dt, v4, gravity);
  y += dt * (velocity + 2 * v2 + 2 * v3 + v4) / 6;
  velocity += dt * (a1 + 2 * a2 + 2 * a3 + a4) / 6;
  const before = compressionAt(previousY), compression = compressionAt(y);
  if (previousY < starY - 12 - radius && y >= starY - 12 - radius) events.collected ??= crossingTime(time, previousY, y, starY - 12 - radius);
  if (!before && compression > 0) events.contact ??= crossingTime(time, previousY, y, springTop - radius);
  if (compression > 0 && previousVelocity > 0 && velocity <= 0) events.maximumCompression ??= crossingTime(time, previousVelocity, velocity, 0);
  if (before > 0 && !compression && velocity < 0) events.release ??= crossingTime(time, previousY, y, springTop - radius);
  if (events.release !== undefined && previousVelocity < 0 && velocity >= 0) events.apex ??= crossingTime(time, previousVelocity, velocity, 0);
  if (events.apex !== undefined && previousVelocity <= 35 && velocity > 35) events.prompt ??= crossingTime(time, previousVelocity, velocity, 35);
  if (events.reversed !== undefined && previousVelocity > 0 && velocity <= 0) events.turnUp ??= crossingTime(time, previousVelocity, velocity, 0);
  if (events.turnUp !== undefined && previousY + radius >= 70 && y + radius < 70) events.exit ??= crossingTime(time, previousY, y, 70 - radius);
  states.push({ y, velocity });
  if (events.exit !== undefined) break;
}

export const springEvents = Object.freeze(events);
export const springPeakCompression = Math.max(...states.map(state => compressionAt(state.y)));
export const springDuration = events.exit + 2;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const wrap = (time, duration) => time >= 0 ? time % duration : (time % duration + duration) % duration;

export function springFrame(elapsed) {
  const time = wrap(elapsed, springDuration);
  const position = Math.min(time / dt, states.length - 1);
  const left = Math.floor(position);
  const right = Math.min(left + 1, states.length - 1);
  const amount = position - left;
  let phase = 'suspended';
  if (time >= events.gravityAdded) phase = 'falling';
  if (time >= events.contact) phase = 'compressing';
  if (time >= events.maximumCompression) phase = 'extending';
  if (time >= events.release) phase = 'bouncing';
  if (time >= events.prompt) phase = 'prepareReverse';
  if (time >= events.reversed) phase = 'slowing';
  if (time >= events.turnUp) phase = 'rising';
  if (time >= events.exit) phase = 'complete';
  const y = mix(states[left].y, states[right].y, amount);
  const velocity = mix(states[left].velocity, states[right].velocity, amount);
  const compression = compressionAt(y);
  const springForce = forceAt(y, velocity);
  return {
    time, phase,
    y, velocity, compression, springForce,
    capY: springTop + compression,
    springEnergy: .5 * springModel.stiffness * compression ** 2,
    gravity: time < events.gravityAdded ? 0 : time < events.reversed ? 9.8 : -9.8,
    collected: time >= events.collected,
    collectionAge: time - events.collected,
    opacity: Math.min(clamp(time / .4), clamp((springDuration - time) / .4)),
  };
}

export const orbitDuration = 13;
export function orbitFrame(elapsed) {
  const time = wrap(elapsed, orbitDuration);
  const mean = time / orbitDuration * Math.PI * 2 + Math.PI;
  const eccentricity = .65;
  let eccentric = mean;
  for (let i = 0; i < 8; i++) eccentric -= (eccentric - eccentricity * Math.sin(eccentric) - mean) / (1 - eccentricity * Math.cos(eccentric));
  return {
    x: 352 - 160 * Math.cos(eccentric),
    y: 193 + 160 * Math.sqrt(1 - eccentricity ** 2) * Math.sin(eccentric),
    angle: eccentric,
    sourceX: 352 - 160 * eccentricity,
    sourceY: 193,
    // Kepler timing: the small body moves faster when it is closer to A.
    speed: 1 / (1 - eccentricity * Math.cos(eccentric)),
  };
}
