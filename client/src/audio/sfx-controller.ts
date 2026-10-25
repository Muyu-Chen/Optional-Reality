import { subscribeGameSounds, type GameSoundEvent } from './game-sound-events';
import { SfxEngine, type SfxPlayback } from './sfx-engine';

export const sfxPreferenceKey = 'optional-reality:sfx';
export type SfxStatus = 'waiting' | 'ready' | 'muted' | 'blocked' | 'unavailable';
export interface SfxSnapshot { enabled: boolean; status: SfxStatus }
type PreferenceStore = Pick<Storage, 'getItem' | 'setItem'>;
function storage(): PreferenceStore | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

/** Immediate game cues, independent of the music preference and simulation clock. */
export class SfxController {
  private snapshot: SfxSnapshot;
  private readonly listeners = new Set<() => void>();
  private engine?: SfxPlayback;
  private trusted = false;
  private disposed = false;
  private attached = false;
  private unlocking = false;
  private revision = 0;
  private unsubscribeEvents?: () => void;

  constructor(private readonly document: Document, private readonly createEngine: () => SfxPlayback = () => new SfxEngine(),
    private readonly store: PreferenceStore | undefined = storage()) {
    let enabled = true;
    try { enabled = store?.getItem(sfxPreferenceKey) !== 'off'; } catch { /* Keep an in-memory preference. */ }
    this.snapshot = { enabled, status: enabled ? 'waiting' : 'muted' };
  }

  getSnapshot = (): SfxSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  attach(): void {
    if (this.disposed || this.attached) return;
    this.attached = true;
    this.document.addEventListener('pointerdown', this.onGesture, { passive: true });
    this.document.addEventListener('keydown', this.onGesture);
    this.document.addEventListener('visibilitychange', this.onVisibility);
    this.unsubscribeEvents = subscribeGameSounds(this.onGameEvent);
  }

  toggle = (trustedGesture = false): void => {
    if (this.disposed) return;
    if (trustedGesture) this.trusted = true;
    const enabled = !this.snapshot.enabled;
    try { this.store?.setItem(sfxPreferenceKey, enabled ? 'on' : 'off'); } catch { /* Do not block gameplay. */ }
    this.update(enabled, enabled ? 'waiting' : 'muted');
    if (enabled) this.tryUnlock();
    else this.cancelPending();
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.revision++;
    this.document.removeEventListener('pointerdown', this.onGesture);
    this.document.removeEventListener('keydown', this.onGesture);
    this.document.removeEventListener('visibilitychange', this.onVisibility);
    this.unsubscribeEvents?.();
    this.engine?.dispose();
    this.listeners.clear();
  }

  private onGesture = (event: Event): void => {
    if (!event.isTrusted || this.disposed) return;
    this.trusted = true;
    this.tryUnlock();
  };

  private onVisibility = (): void => {
    if (this.document.visibilityState === 'hidden') {
      this.cancelPending();
      this.update(this.snapshot.enabled, this.snapshot.enabled ? 'waiting' : 'muted');
    } else this.tryUnlock();
  };

  private onGameEvent = (event: GameSoundEvent): void => {
    if (this.disposed) return;
    if (event.kind === 'cancel') { this.cancelPending(); return; }
    // No event backlog: anything that occurs before unlocking, muted or hidden is discarded.
    if (!this.snapshot.enabled || this.snapshot.status !== 'ready' || this.document.visibilityState === 'hidden') return;
    try { this.engine?.play(event); } catch {
      this.cancelPending(); this.update(this.snapshot.enabled, 'blocked');
    }
  };

  private cancelPending(): void {
    this.revision++;
    const wasUnlocking = this.unlocking;
    this.unlocking = false;
    try { this.engine?.cancel(); } catch { /* Sound must remain optional. */ }
    if (wasUnlocking) this.update(this.snapshot.enabled, this.snapshot.enabled ? 'waiting' : 'muted');
  }

  private tryUnlock(): void {
    if (this.disposed || this.unlocking || !this.snapshot.enabled || !this.trusted ||
      this.document.visibilityState === 'hidden' || this.snapshot.status === 'ready') return;
    const revision = ++this.revision;
    this.unlocking = true;
    let pending: Promise<boolean>;
    try { this.engine ||= this.createEngine(); pending = this.engine.unlock(); }
    catch { this.unlocking = false; this.update(true, 'unavailable'); return; }
    void pending.then(ready => {
      if (this.disposed || revision !== this.revision) return;
      this.unlocking = false;
      this.update(this.snapshot.enabled, ready ? 'ready' : 'blocked');
    }).catch(error => {
      if (this.disposed || revision !== this.revision) return;
      this.unlocking = false;
      this.update(this.snapshot.enabled, error?.name === 'NotSupportedError' ? 'unavailable' : 'blocked');
    });
  }

  private update(enabled: boolean, status: SfxStatus): void {
    if (enabled === this.snapshot.enabled && status === this.snapshot.status) return;
    this.snapshot = { enabled, status };
    for (const listener of this.listeners) listener();
  }
}
