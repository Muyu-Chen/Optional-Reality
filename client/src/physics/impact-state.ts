import type { ImpactContact } from './impact-contact';

export interface ImpactPulse extends ImpactContact {
  kind: 'impact'; born: number; duration: number; strength: number;
}

/** Bounded presentation state, measured in simulation seconds so pausing freezes it. */
export class ImpactState {
  private pulses: ImpactPulse[] = [];
  private lastBySurface = new Map<string, number>();
  private lastAny = -Infinity;
  private reduced = false;
  time = 0;
  get active(): readonly ImpactPulse[] { return this.pulses; }

  advance(time: number, reduced = false) {
    if (!Number.isFinite(time)) return;
    if (time < this.time) this.clear();
    this.time = time;
    this.reduced = reduced;
    if (reduced) this.pulses = [];
    else this.pulses = this.pulses.filter(pulse => time - pulse.born < pulse.duration);
  }

  record(contact: ImpactContact, born: number) {
    // Tangential sliding and tiny resting-contact jitter should not look like impacts.
    if (this.reduced || !Number.isFinite(contact.speed) || contact.speed <= .25 || !Number.isFinite(born)) return;
    if (born - this.lastAny < .045 || born - (this.lastBySurface.get(contact.surface) ?? -Infinity) < .12) return;
    const strength = Math.min(1, (contact.speed - .25) / 3.25);
    this.pulses.push({ ...contact, normal: { ...contact.normal }, kind: 'impact', born, strength, duration: .24 + strength * .1 });
    if (this.pulses.length > 8) this.pulses.shift();
    this.lastAny = born; this.lastBySurface.set(contact.surface, born);
    if (this.lastBySurface.size > 32) this.lastBySurface.delete(this.lastBySurface.keys().next().value!);
  }

  clear() { this.pulses = []; this.lastBySurface.clear(); this.lastAny = -Infinity; }
}
