import { musicBeatSeconds, notesAtBeat, type MusicNote } from './music-score';

export interface MusicPlayback {
  play(): Promise<boolean>;
  pause(): void;
  dispose(): void;
}

export function browserAudioContext(): AudioContext {
  const browser = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Context = window.AudioContext || browser.webkitAudioContext;
  if (!Context) throw new Error('Web Audio is unavailable');
  return new Context();
}

/** One audio graph and one short look-ahead scheduler, independent of the physics clock. */
export class MusicEngine implements MusicPlayback {
  private context?: AudioContext;
  private master?: GainNode;
  private filter?: BiquadFilterNode;
  private timer?: ReturnType<typeof setInterval>;
  private voices = new Map<OscillatorNode, GainNode>();
  private nextBeatTime = 0;
  private beat = 0;
  private revision = 0;
  private wanted = false;
  private disposed = false;

  constructor(private readonly createContext = browserAudioContext) {}

  async play(): Promise<boolean> {
    if (this.disposed) return false;
    this.wanted = true;
    const revision = ++this.revision;
    if (!this.context) {
      const context = this.createContext();
      const master = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      filter.Q.value = .4;
      master.gain.value = 0;
      filter.connect(master);
      master.connect(context.destination);
      this.context = context;
      this.master = master;
      this.filter = filter;
    }
    const context = this.context;
    await context.resume();
    if (this.disposed || revision !== this.revision || !this.wanted) {
      // A mute or hidden-tab event may have arrived while resume was pending.
      if (!this.disposed && !this.wanted) void context.suspend().catch(() => {});
      return false;
    }
    if (context.state !== 'running') throw new Error('Browser audio is suspended');
    if (this.timer !== undefined) return true;
    this.master!.gain.cancelScheduledValues(context.currentTime);
    this.master!.gain.setValueAtTime(0, context.currentTime);
    this.master!.gain.linearRampToValueAtTime(.45, context.currentTime + .4);
    this.nextBeatTime = context.currentTime + .04;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 125);
    return true;
  }

  pause(): void {
    this.wanted = false;
    this.revision++;
    this.stopScheduler();
    if (!this.context || this.disposed) return;
    this.master!.gain.cancelScheduledValues(this.context.currentTime);
    this.master!.gain.setValueAtTime(0, this.context.currentTime);
    void this.context.suspend().catch(() => {});
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.wanted = false;
    this.revision++;
    this.stopScheduler();
    this.filter?.disconnect();
    this.master?.disconnect();
    void this.context?.close().catch(() => {});
  }

  private stopScheduler(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
    for (const [voice, gain] of this.voices) {
      voice.onended = null;
      try { voice.stop(); } catch { /* A source may already have ended. */ }
      voice.disconnect();
      gain.disconnect();
    }
    this.voices.clear();
  }

  private schedule(): void {
    const context = this.context!;
    if (context.state !== 'running') return;
    // A throttled timer must not try to replay a backlog of notes at once.
    if (this.nextBeatTime < context.currentTime) this.nextBeatTime = context.currentTime + .04;
    while (this.nextBeatTime < context.currentTime + .35) {
      for (const note of notesAtBeat(this.beat)) this.scheduleNote(note, this.nextBeatTime);
      this.beat = (this.beat + 1) % 32;
      this.nextBeatTime += musicBeatSeconds;
    }
  }

  private scheduleNote(note: MusicNote, time: number): void {
    const context = this.context!;
    const voice = context.createOscillator();
    const gain = context.createGain();
    voice.type = note.waveform;
    voice.frequency.value = 440 * 2 ** ((note.pitch - 69) / 12);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(note.gain, time + note.attack);
    gain.gain.exponentialRampToValueAtTime(.0001, time + note.duration);
    voice.connect(gain);
    gain.connect(this.filter!);
    this.voices.set(voice, gain);
    voice.onended = () => {
      this.voices.delete(voice);
      voice.disconnect();
      gain.disconnect();
    };
    voice.start(time);
    voice.stop(time + note.duration + .03);
  }
}
