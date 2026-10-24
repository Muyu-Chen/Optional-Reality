import Matter from 'matter-js';
import type { LevelDefinition, TrackDefinition } from '../levels/types';

const { Bodies, Body } = Matter;
const staticSurface = { isStatic: true, friction: 0, restitution: 0 };

function trackBodies(track: TrackDefinition) {
  const material = { ...staticSurface, label: track.id };
  const bodies: Matter.Body[] = [];
  for (let i = 0; i < track.points.length - 1; i++) {
    const [a, b] = [track.points[i], track.points[i + 1]];
    bodies.push(Bodies.rectangle(
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      Math.hypot(b[0] - a[0], b[1] - a[1]) + 2,
      track.thickness,
      { ...material, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) },
    ));
  }
  for (const [x, y] of track.points) bodies.push(Bodies.circle(x, y, track.thickness / 2, material));
  return bodies;
}

function boundaries(level: LevelDefinition) {
  const { width, height } = level.viewport;
  return [
    ...(!level.failOnFall ? [Bodies.rectangle(width / 2, height + 18, width + 72, 36,
      { ...staticSurface, label: 'boundary-bottom' })] : []),
    Bodies.rectangle(-18, height / 2, 36, height * 2, { ...staticSurface, label: 'boundary-left' }),
    Bodies.rectangle(width + 18, height / 2, 36, height * 2, { ...staticSurface, label: 'boundary-right' }),
    Bodies.rectangle(width / 2, (level.ceilingY ?? 0) - 18, width + 72, 36, { ...staticSurface, label: 'boundary-top' }),
  ];
}

// Construction is separate from simulation and rendering. Preserve insertion order
// because Matter's collision solver can depend on the ordering of its bodies.
export function createSceneBodies(level: LevelDefinition) {
  const surfaces = new Map<string, Matter.Body[]>();
  const rails: Matter.Body[] = [];
  for (const track of level.tracks) {
    const bodies = trackBodies(track);
    surfaces.set(track.id, bodies);
    rails.push(...bodies);
  }
  const { ball: definition, viewport } = level;
  const ball = Bodies.circle(...definition.position, definition.radius, {
    friction: 1, frictionStatic: 0, frictionAir: 0, restitution: definition.restitution, label: definition.id,
  });
  // Matter normalises velocity to its 60 Hz reference step.
  Body.setVelocity(ball, {
    x: definition.velocity[0] * viewport.pixelsPerMetre / 60,
    y: definition.velocity[1] * viewport.pixelsPerMetre / 60,
  });
  return { ball, surfaces, bodies: [...rails, ball, ...boundaries(level)] };
}
