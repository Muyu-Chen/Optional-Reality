import type { GameSoundEvent } from './game-sound-events';
import { browserAudioContext } from './music-engine';

export interface SfxPlayback {
  unlock(): Promise<boolean>;
  play(event: GameSoundEvent): void;
  cancel(): void;
  dispose(): void;
}
interface Tone {
  from: number; to?: number; delay?: number; duration: number; gain: number;
  waveform?: OscillatorType;
}
const midi = (pitch: number) => 440 * 2 ** ((pitch - 69) / 12);
const MAX_VOICES = 12;

/** Original short cues. One reusable graph, bounded voices and no timer/event queue. */
export class SfxEngine implements SfxPlayback {
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Map<OscillatorNode, GainNode>();
  private revision = 0;
  private disposed = false;

  constructor(private readonly createContext = browserAudioContext) {}

  async unlock(): Promise<boolean> {
    if (this.disposed) return false;
    const revision = ++this.revision;
    if (!this.context) {
      let context: AudioContext | undefined;
      try {
        context = this.createContext();
        const master = context.createGain();
        master.gain.value = .16;
        master.connect(context.destination);
        this.context = context;
        this.master = master;
      } catch {
        void context?.close().catch(() => {});
        throw Object.assign(new Error('Sound effects are unavailable'), { name: 'NotSupportedError' });
      }
    }
    await this.context.resume();
    if (this.disposed || revision !== this.revision) return false;
    return this.context.state === 'running';
  }

  play(event: GameSoundEvent): void {
    if (event.kind === 'cancel') { this.cancel(); return; }
    if (this.disposed || !this.master || !this.context) return;
    if (this.context.state !== 'running') throw new Error('Browser sound effects are suspended');
    // The exit's quiet downward sweep replaces old pickup/confirmation tails.
    if (event.kind === 'exit') this.cancel();
    this.master.gain.setValueAtTime(.16, this.context.currentTime);
    for (const tone of this.tones(event)) this.note(tone);
  }

  cancel(): void {
    this.revision++;
    for (const [voice, gain] of this.voices) this.stop(voice, gain);
    this.voices.clear();
    if (this.master && this.context?.state !== 'closed') {
      this.master.gain.cancelScheduledValues(this.context!.currentTime);
      this.master.gain.setValueAtTime(0, this.context!.currentTime);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancel();
    this.disposed = true;
    this.master?.disconnect();
    void this.context?.close().catch(() => {});
  }

  private tones(event: Exclude<GameSoundEvent, { kind: 'cancel' }>): Tone[] {
    switch (event.kind) {
      case 'star': {
        const step = Number.isFinite(event.collected) ? Math.min(5, Math.max(0, Math.floor(event.collected) - 1)) : 0;
        const pitch = midi(72 + step * 2);
        return [{ from: pitch, duration: .22, gain: .12 }, { from: pitch * 2, delay: .018, duration: .14, gain: .035 }];
      }
      case 'spring': return [{ from: 220, to: 580, duration: .17, gain: .13 }, { from: 330, delay: .04, duration: .18, gain: .025 }];
      case 'rule': return [{ from: 440, duration: .09, gain: .055 }, { from: 554.37, delay: .055, duration: .11, gain: .05 }];
      case 'exit': return [{ from: 660, to: 90, duration: .7, gain: .1 }, { from: 330, to: 55, delay: .03, duration: .75, gain: .045 }];
      case 'complete': return [523.25, 659.25, 783.99].map((from, index) => ({ from, delay: index * .07, duration: .42, gain: .065 }));
      default: return [];
    }
  }

  private note(tone: Tone): void {
    const context = this.context!;
    while (this.voices.size >= MAX_VOICES) {
      const [voice, gain] = this.voices.entries().next().value!;
      this.stop(voice, gain); this.voices.delete(voice);
    }
    const voice = context.createOscillator(), gain = context.createGain();
    const start = context.currentTime + (tone.delay || 0), end = start + tone.duration;
    voice.type = tone.waveform || 'sine';
    voice.frequency.setValueAtTime(tone.from, start);
    if (tone.to) voice.frequency.exponentialRampToValueAtTime(tone.to, end);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(tone.gain, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    voice.connect(gain); gain.connect(this.master!);
    this.voices.set(voice, gain);
    voice.onended = () => { this.voices.delete(voice); voice.disconnect(); gain.disconnect(); };
    voice.start(start); voice.stop(end + .02);
  }

  private stop(voice: OscillatorNode, gain: GainNode): void {
    voice.onended = null;
    try { voice.stop(); } catch { /* A source may already have ended. */ }
    voice.disconnect(); gain.disconnect();
  }
}
