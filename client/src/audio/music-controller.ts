import { MusicEngine, type MusicPlayback } from './music-engine';

export const musicPreferenceKey = 'optional-reality:music';
export type MusicStatus = 'waiting' | 'playing' | 'muted' | 'blocked' | 'unavailable';
export interface MusicSnapshot { enabled: boolean; status: MusicStatus }
type PreferenceStore = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): PreferenceStore | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

/** Browser policy, preference and visibility belong here; no game rules or simulation state. */
export class MusicController {
  private snapshot: MusicSnapshot;
  private listeners = new Set<() => void>();
  private engine?: MusicPlayback;
  private gestureReceived = false;
  private disposed = false;
  private starting = false;
  private revision = 0;
  private attached = false;
  private readonly store: PreferenceStore | undefined;

  constructor(private readonly document: Document, private readonly createEngine: () => MusicPlayback = () => new MusicEngine(),
    store: PreferenceStore | undefined = browserStorage()) {
    this.store = store;
    let enabled = true;
    try { enabled = store?.getItem(musicPreferenceKey) !== 'off'; } catch { /* Private storage may be denied. */ }
    this.snapshot = { enabled, status: enabled ? 'waiting' : 'muted' };
  }

  getSnapshot = (): MusicSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  attach(): void {
    if (this.attached || this.disposed) return;
    this.attached = true;
    this.document.addEventListener('pointerdown', this.onGesture, { passive: true });
    this.document.addEventListener('keydown', this.onGesture);
    this.document.addEventListener('visibilitychange', this.onVisibility);
  }

  toggle = (trustedGesture = false): void => {
    if (this.disposed) return;
    if (trustedGesture) this.gestureReceived = true;
    const enabled = !this.snapshot.enabled;
    try { this.store?.setItem(musicPreferenceKey, enabled ? 'on' : 'off'); } catch { /* Keep the in-memory preference. */ }
    this.update(enabled, enabled ? 'waiting' : 'muted');
    if (enabled) this.tryStart();
    else this.pause();
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.revision++;
    this.document.removeEventListener('pointerdown', this.onGesture);
    this.document.removeEventListener('keydown', this.onGesture);
    this.document.removeEventListener('visibilitychange', this.onVisibility);
    this.engine?.dispose();
    this.listeners.clear();
  }

  private onGesture = (event: Event): void => {
    // Programmatic UI actions must not create an autoplaying AudioContext.
    if (!event.isTrusted || this.disposed) return;
    this.gestureReceived = true;
    this.tryStart();
  };

  private onVisibility = (): void => {
    if (this.document.visibilityState === 'hidden') this.pause();
    else this.tryStart();
  };

  private pause(): void {
    this.revision++;
    this.starting = false;
    this.engine?.pause();
    this.update(this.snapshot.enabled, this.snapshot.enabled ? 'waiting' : 'muted');
  }

  private tryStart(): void {
    if (this.disposed || this.starting || !this.snapshot.enabled || !this.gestureReceived ||
      this.document.visibilityState === 'hidden' || this.snapshot.status === 'playing') return;
    const revision = ++this.revision;
    this.starting = true;
    let playback: Promise<boolean>;
    try {
      this.engine ||= this.createEngine();
      playback = this.engine.play();
    } catch {
      this.starting = false;
      this.update(true, 'unavailable');
      return;
    }
    void playback.then(playing => {
      if (this.disposed || revision !== this.revision) return;
      this.starting = false;
      this.update(this.snapshot.enabled, playing ? 'playing' : 'waiting');
    }).catch(() => {
      if (this.disposed || revision !== this.revision) return;
      this.starting = false;
      // The next trusted gesture retries audio without interrupting the game.
      this.update(this.snapshot.enabled, 'blocked');
    });
  }

  private update(enabled: boolean, status: MusicStatus): void {
    if (this.snapshot.enabled === enabled && this.snapshot.status === status) return;
    this.snapshot = { enabled, status };
    for (const listener of this.listeners) listener();
  }
}
