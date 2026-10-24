import { afterEach, describe, expect, it, vi } from 'vitest';
import { gravityLab } from '../levels/gravity-lab';
import { bounce } from '../levels/bounce';
import { loadMessages, messageStorageKey } from './message-storage';

afterEach(() => vi.unstubAllGlobals());
function saved(value: unknown) {
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(value) });
}

describe('stored message drafts', () => {
  it.each([null, {}, 42, 'text'])('ignores a non-array saved value: %j', value => {
    saved(value);
    expect(loadMessages(gravityLab)).toEqual([]);
  });

  it('ignores corrupted JSON and denied storage access', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{broken' });
    expect(loadMessages(gravityLab)).toEqual([]);
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); } });
    expect(loadMessages(gravityLab)).toEqual([]);
  });

  it('filters invalid entries, limits restored drafts and reparses text instead of trusting operations', () => {
    saved([null, 1, '', 'x'.repeat(241), { text: 'add gravity', operations: [{ type: 'eval' }] }, ...Array(30).fill('add gravity')]);
    const messages = loadMessages(gravityLab);
    expect(messages).toHaveLength(24);
    expect(new Set(messages.map(message => message.id)).size).toBe(24);
    expect(messages.every(message => message.status === 'ready' && message.source === 'local')).toBe(true);
    expect(messages.every(message => message.operation?.type === 'set_gravity')).toBe(true);
  });

  it('keeps per-level drafts separate and validates against the active level’s permissions', () => {
    expect(messageStorageKey(bounce)).not.toBe(messageStorageKey(gravityLab));
    saved(['add gravity']);
    expect(loadMessages(gravityLab)[0].status).toBe('ready');
    expect(loadMessages(bounce)[0].status).toBe('error');
  });
});
