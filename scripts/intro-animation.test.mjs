import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DiagramPlayer } from '../site/assets/diagram-player-20261024.js';
import { orbitDuration, orbitFrame, springDuration, springEvents, springFrame, springModel } from '../site/assets/diagram-timeline-20261024.js';

test('spring actions occur in the intended order, with just one automatic spring contact', () => {
  const order = ['gravityAdded', 'collected', 'contact', 'maximumCompression', 'release', 'apex', 'prompt', 'reversed', 'turnUp', 'exit'];
  for (let i = 1; i < order.length; i++) assert.ok(springEvents[order[i]] > springEvents[order[i - 1]]);
  assert.equal(springFrame(1).gravity, 0);
  assert.equal(springFrame(1).y, 100);
  let contacts = 0, previous = false, maximum = 0;
  for (let t = 0; t < springEvents.exit; t += 1 / 240) {
    const state = springFrame(t);
    if (state.compression > 0 && !previous) contacts++;
    previous = state.compression > 0;
    maximum = Math.max(maximum, state.compression);
  }
  assert.equal(contacts, 1);
  assert.ok(maximum > 25 && maximum < 45);
  assert.ok(springEvents.release - springEvents.contact > .5);
  assert.ok(springFrame(springEvents.reversed).velocity > 0, 'The ball is still falling when acceleration flips.');
  assert.ok(springFrame(springEvents.turnUp).y > springFrame(springEvents.reversed).y, 'It decelerates before rising.');
});

test('spring samples interpolate continuously and hide their loop reset', () => {
  for (const time of Object.values(springEvents)) {
    assert.ok(Math.abs(springFrame(time + .0001).y - springFrame(time - .0001).y) < .1);
  }
  assert.equal(springFrame(springDuration).opacity, 0);
  assert.ok(springFrame(springDuration - .0001).opacity < .001);
  assert.equal(springFrame(springDuration + 1).y, springFrame(1).y);
});

test('spring contact and release preserve velocity instead of applying a launch impulse', () => {
  for (const event of ['contact', 'release']) {
    const at = springEvents[event];
    const before = springFrame(at - .0001), after = springFrame(at + .0001);
    assert.ok(Math.abs(after.y - before.y) < .05, `${event} cannot teleport the ball.`);
    assert.ok(Math.abs(after.velocity - before.velocity) < .1, `${event} cannot reset velocity.`);
  }
  assert.ok(springFrame(springEvents.contact).velocity > 180);
  assert.ok(springFrame(springEvents.release).velocity < -160);
  for (let t = springEvents.contact + .004; t < springEvents.release - .004; t += 1 / 480) {
    const state = springFrame(t);
    assert.ok(Math.abs(state.capY - state.y - springModel.radius) < 1e-9, 'Cap follows the ball bottom throughout contact.');
  }
});

test('maximum compression has zero velocity followed by continuous upward acceleration', () => {
  const maximum = springEvents.maximumCompression;
  const before = springFrame(maximum - .02), at = springFrame(maximum), after = springFrame(maximum + .02);
  assert.ok(before.velocity > 0);
  assert.ok(Math.abs(at.velocity) < 1e-8);
  assert.ok(after.velocity < 0);
  assert.ok(at.compression > before.compression && at.compression > after.compression);
  assert.ok(at.springEnergy > before.springEnergy && at.springEnergy > after.springEnergy);
  assert.ok(at.springForce > springModel.gravity);
});

test('a passive damped spring cannot add energy or rebound above its original height', () => {
  const initialEnergy = springModel.gravity * (springModel.restTop - springModel.radius - springModel.initialY);
  let previousEnergy = initialEnergy;
  for (let time = springEvents.gravityAdded; time < springEvents.apex; time += 1 / 480) {
    const state = springFrame(time);
    const energy = .5 * state.velocity ** 2 + springModel.gravity * (springModel.restTop - springModel.radius - state.y) + state.springEnergy;
    assert.ok(energy <= initialEnergy + .02, 'No hidden launch energy.');
    assert.ok(energy <= previousEnergy + .02, 'Damping dissipates energy.');
    previousEnergy = energy;
  }
  const rebound = springFrame(springEvents.apex);
  assert.ok(rebound.y > springModel.initialY);
  assert.ok(Math.abs(rebound.velocity) < 1e-8);
});

test('after release the ball follows gravity alone until the next rule changes it', () => {
  for (let time = springEvents.release + .01; time < springEvents.reversed - .02; time += .02) {
    const state = springFrame(time), next = springFrame(time + .01);
    assert.equal(state.springForce, 0);
    assert.equal(state.compression, 0);
    assert.ok(Math.abs((next.velocity - state.velocity) / .01 - springModel.gravity) < 1e-7);
    assert.ok(Math.abs(state.capY - springModel.restTop) < 1e-9);
  }
});

test('orbit repeats smoothly, varies its speed, and never overlaps the source', () => {
  let minSpeed = Infinity, maxSpeed = 0;
  for (let time = 0; time < orbitDuration; time += .01) {
    const state = orbitFrame(time);
    assert.ok(Math.hypot(state.x - state.sourceX, state.y - state.sourceY) > 45);
    minSpeed = Math.min(minSpeed, state.speed); maxSpeed = Math.max(maxSpeed, state.speed);
  }
  assert.ok(maxSpeed / minSpeed > 3);
  const before = orbitFrame(orbitDuration - .00001), after = orbitFrame(.00001);
  assert.ok(Math.hypot(before.x - after.x, before.y - after.y) < .01);
  assert.deepEqual(orbitFrame(orbitDuration), orbitFrame(0));
});

function target(initial = {}) {
  const listeners = new Map();
  return Object.assign({
    listeners,
    addEventListener(name, listener) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener); },
    removeEventListener(name, listener) { listeners.get(name)?.delete(listener); },
    emit(name) { for (const listener of listeners.get(name) || []) listener(); },
  }, initial);
}

function harness({ intersection = true, context = true, throwPaint = false } = {}) {
  const frames = new Map(); let nextId = 1;
  const document = target({ visibilityState: 'visible' });
  const window = target({ innerWidth: 1000, innerHeight: 800, devicePixelRatio: 2 });
  const classes = new Set();
  const bounds = { left: 0, top: 0, right: 640, bottom: 360, width: 640, height: 360 };
  const parent = { getBoundingClientRect: () => bounds, classList: {
    add: (...names) => names.forEach(name => classes.add(name)),
    remove: (...names) => names.forEach(name => classes.delete(name)),
    toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
  } };
  const transforms = [];
  const canvas = { width: 640, height: 360, parentElement: parent, getBoundingClientRect: () => bounds,
    getContext: () => context ? { setTransform: (...values) => transforms.push(values) } : null };
  let intersectionCallback, resizeCallback, intersectionDisconnected = 0, resizeDisconnected = 0;
  const runtime = { document, window,
    requestFrame(callback) { const id = nextId++; frames.set(id, callback); return id; },
    cancelFrame(id) { frames.delete(id); },
    createIntersectionObserver: intersection ? callback => { intersectionCallback = callback; return { observe() {}, disconnect() { intersectionDisconnected++; } }; } : null,
    createResizeObserver(callback) { resizeCallback = callback; return { observe() {}, disconnect() { resizeDisconnected++; } }; },
  };
  const paints = [];
  const player = new DiagramPlayer(canvas, (_context, elapsed) => {
    if (throwPaint) throw new Error('Canvas API unsupported');
    paints.push(elapsed);
  }, runtime);
  const tick = timestamp => {
    const [id, callback] = frames.entries().next().value || [];
    if (callback) { frames.delete(id); callback(timestamp); }
  };
  return { player, paints, frames, document, window, classes, canvas, bounds, transforms, tick,
    intersect: visible => intersectionCallback([{ target: canvas, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]),
    resize: () => resizeCallback(), disconnected: () => [intersectionDisconnected, resizeDisconnected] };
}

test('RAF uses elapsed seconds consistently at 60 and 120 Hz and caps stalled frames', () => {
  for (const hz of [60, 120]) {
    const h = harness();
    for (let frame = 0; frame <= hz; frame++) h.tick(frame * 1000 / hz);
    assert.ok(Math.abs(h.player.elapsed - 1) < 1e-8);
    h.tick(61000);
    assert.ok(h.player.elapsed <= 1.051);
    h.player.destroy();
  }
});

test('pause, hidden tab and offscreen visibility freeze time without a resume jump', () => {
  const h = harness(); h.tick(0); h.tick(20);
  for (const reason of ['user', 'hidden', 'offscreen', 'page']) {
    if (reason === 'user') h.player.setPaused(true);
    if (reason === 'hidden') { h.document.visibilityState = 'hidden'; h.document.emit('visibilitychange'); }
    if (reason === 'offscreen') h.intersect(false);
    if (reason === 'page') h.player.setPageActive(false);
    const before = h.player.elapsed;
    assert.equal(h.frames.size, 0);
    if (reason === 'user') h.player.setPaused(false);
    if (reason === 'hidden') { h.document.visibilityState = 'visible'; h.document.emit('visibilitychange'); }
    if (reason === 'offscreen') h.intersect(true);
    if (reason === 'page') h.player.setPageActive(true);
    h.tick(100000);
    assert.equal(h.player.elapsed, before);
    h.tick(100020);
    assert.ok(Math.abs(h.player.elapsed - before - .02) < 1e-8);
  }
  h.player.destroy();
});

test('dynamic reduced motion uses the poster and resumes only when allowed', () => {
  const h = harness();
  h.player.setReducedMotion(true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.classes.has('diagram-static'), true);
  h.player.setPaused(true);
  h.player.setReducedMotion(false);
  assert.equal(h.classes.has('diagram-static'), false);
  assert.equal(h.frames.size, 0);
  h.player.setPaused(false);
  assert.equal(h.frames.size, 1);
  h.player.destroy();
});

test('resize applies the current DPR and teardown removes observers, frames and listeners once', () => {
  const h = harness();
  assert.equal(h.canvas.width, 1280); assert.equal(h.canvas.height, 720);
  h.window.devicePixelRatio = 1.5; h.bounds.width = 320; h.bounds.height = 180; h.resize();
  assert.equal(h.canvas.width, 480); assert.equal(h.canvas.height, 270);
  assert.deepEqual(h.transforms.at(-1), [.75, 0, 0, .75, 0, 0]);
  h.player.destroy(); h.player.destroy();
  assert.equal(h.frames.size, 0);
  assert.deepEqual(h.disconnected(), [1, 1]);
  assert.ok([...h.window.listeners.values(), ...h.document.listeners.values()].every(set => !set.size));
  assert.equal(h.classes.has('diagram-ready'), false);
});

test('no Canvas or a partial 2D API failure falls back without leaked work', () => {
  const missing = harness({ context: false });
  assert.equal(missing.player.available, false); assert.equal(missing.frames.size, 0);
  missing.player.destroy();
  const failed = harness({ throwPaint: true });
  assert.equal(failed.player.available, false); assert.equal(failed.frames.size, 0);
  assert.deepEqual(failed.disconnected(), [1, 1]);
  assert.ok([...failed.window.listeners.values(), ...failed.document.listeners.values()].every(set => !set.size));
});

test('scroll visibility still pauses diagrams without IntersectionObserver', () => {
  const h = harness({ intersection: false });
  h.bounds.top = 900; h.bounds.bottom = 1260; h.window.emit('scroll');
  assert.equal(h.frames.size, 0);
  h.bounds.top = 20; h.bounds.bottom = 380; h.window.emit('scroll');
  assert.equal(h.frames.size, 1);
  h.player.destroy();
});
