import { describe, expect, it } from 'vitest';
import { CompilationSession } from './compilation-session';

describe('compilation lifecycle', () => {
  it('allows one active preparation and finishes it only once', () => {
    const session = new CompilationSession();
    const ticket = session.begin()!;
    expect(session.begin()).toBeNull();
    expect(session.isCurrent(ticket)).toBe(true);
    expect(session.finish(ticket)).toBe(true);
    expect(session.finish(ticket)).toBe(false);
    expect(session.begin()).not.toBeNull();
  });

  it('rejects an edited queue response without ending the replacement request', () => {
    const session = new CompilationSession();
    const beforeEdit = session.begin()!;
    session.queueChanged();
    const afterEdit = session.begin()!;
    expect(beforeEdit.signal.aborted).toBe(true);
    expect(afterEdit.queueRevision).toBe(beforeEdit.queueRevision + 1);
    expect(session.isCurrent(beforeEdit)).toBe(false);
    expect(session.finish(beforeEdit)).toBe(false);
    expect(session.isCurrent(afterEdit)).toBe(true);
  });

  it('invalidates requests on retry and keeps scene and queue versions separate', () => {
    const session = new CompilationSession();
    const oldAttempt = session.begin()!;
    session.sceneChanged();
    const newAttempt = session.begin()!;
    expect(oldAttempt.signal.aborted).toBe(true);
    expect(session.isCurrent(oldAttempt)).toBe(false);
    expect(newAttempt.sceneVersion).toBe(oldAttempt.sceneVersion + 1);
    expect(newAttempt.queueRevision).toBe(oldAttempt.queueRevision);
  });

  it('discards responses after unmount cancellation even with matching versions', () => {
    const session = new CompilationSession();
    const previous = session.begin()!;
    session.cancel();
    const current = session.begin()!;
    expect(previous.sceneVersion).toBe(current.sceneVersion);
    expect(previous.queueRevision).toBe(current.queueRevision);
    expect(session.isCurrent(previous)).toBe(false);
    expect(session.isCurrent(current)).toBe(true);
  });
});
