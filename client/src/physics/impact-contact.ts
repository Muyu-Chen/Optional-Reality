import Matter from 'matter-js';

export interface IncomingMotion {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  angularVelocity: number;
}
export interface ImpactContact {
  x: number; y: number;
  normal: { x: number; y: number };
  speed: number;
  surface: string;
  colour: string;
}

// Sample before constraints/contact impulses. All values are copied; no body is modified.
export function incomingMotion(body: Matter.Body): IncomingMotion {
  const velocity = Matter.Body.getVelocity(body);
  return { position: { ...body.position }, velocity: { x: velocity.x * 60, y: velocity.y * 60 },
    angularVelocity: Matter.Body.getAngularVelocity(body) * 60 };
}

function velocityAt(motion: IncomingMotion, point: { x: number; y: number }) {
  return { x: motion.velocity.x - (point.y - motion.position.y) * motion.angularVelocity,
    y: motion.velocity.y + (point.x - motion.position.x) * motion.angularVelocity };
}

/** Contact normal points away from the surface, toward the actor. Speed is SI m/s. */
export function measureImpact(pair: Matter.Pair, actor: Matter.Body, incoming: IncomingMotion, pixelsPerMetre: number,
  colour: string): ImpactContact | null {
  if (pair.isSensor || !Number.isFinite(pixelsPerMetre) || pixelsPerMetre <= 0) return null;
  const collision = pair.collision;
  const actorIsA = collision.parentA === actor;
  if (!actorIsA && collision.parentB !== actor) return null;
  const other = actorIsA ? collision.parentB : collision.parentA;
  // Matter retains its two-slot support array even when only one support is current.
  const supportCount = (collision as Matter.Collision & { supportCount?: number }).supportCount ?? collision.supports.length;
  const points = collision.supports.slice(0, supportCount).filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!points.length) return null;
  const point = { x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  const sign = actorIsA ? 1 : -1;
  const length = Math.hypot(collision.normal.x, collision.normal.y);
  if (!Number.isFinite(length) || length < 1e-8) return null;
  const normal = { x: collision.normal.x * sign / length, y: collision.normal.y * sign / length };
  const actorVelocity = velocityAt(incoming, point);
  // collisionStart runs before the solver; the other body's motion is still incoming too.
  const otherVelocity = velocityAt(incomingMotion(other), point);
  const speed = -((actorVelocity.x - otherVelocity.x) * normal.x + (actorVelocity.y - otherVelocity.y) * normal.y) / pixelsPerMetre;
  if (!Number.isFinite(speed) || speed <= 0) return null;
  return { ...point, normal, speed, surface: other.label, colour };
}
