import type { ImpactPulse } from './impact-state';

export interface ActorImpactPose { angle: number; normalScale: number; tangentScale: number }

/** Pure drawing transform. Area is preserved; no collider, coordinate or speed changes. */
export function actorImpactPose(impacts: readonly ImpactPulse[], time: number, reduced = false): ActorImpactPose | undefined {
  if (reduced) return;
  let strongest = 0, selected: ImpactPulse | undefined;
  for (const impact of impacts) {
    const p = (time - impact.born) / .22;
    if (p < 0 || p >= 1) continue;
    const envelope = Math.sin(Math.PI * p) * Math.exp(-p * 1.6) * 2;
    const amount = impact.strength * envelope;
    if (amount > strongest) { strongest = amount; selected = impact; }
  }
  if (!selected) return;
  const normalScale = 1 - Math.min(.08, strongest * .08);
  return { angle: Math.atan2(selected.normal.y, selected.normal.x), normalScale, tangentScale: 1 / normalScale };
}

export function applyActorImpactPose(ctx: CanvasRenderingContext2D, pose?: ActorImpactPose) {
  if (!pose) return;
  ctx.rotate(pose.angle); ctx.scale(pose.normalScale, pose.tangentScale); ctx.rotate(-pose.angle);
}
