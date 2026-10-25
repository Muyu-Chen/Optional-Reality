import { describe, expect, it } from 'vitest';
import { mergeCompilationResults } from './compilation-results';
import { messageOperations, type Message } from './queue';
import { initialRules, ruleContext } from '../levels/rules';
import { gravityLab } from '../levels/gravity-lab';
import type { CompilationMessage } from '../../../shared/compilation-message';

const context = ruleContext(gravityLab), state = initialRules(gravityLab);
const drafts = (): Message[] => ['a', 'b', 'c'].map(id => ({ id, text: id, status: 'draft' }));
const setY = (value: number) => ({ type: 'set_gravity' as const, acceleration: value });

describe('merging per-message compilation results', () => {
  it('keeps successful rows ready around a rejected row and preserves other queue entries', () => {
    const outside: Message = { id: 'outside', text: 'local', status: 'ready', operation: setY(0) };
    const messages = [...drafts(), outside], before = structuredClone(messages);
    const results: CompilationMessage[] = [
      { id: 'a', operations: [setY(1)] }, { id: 'b', operations: [], error: 'Unsupported color.' },
      { id: 'c', operations: [setY(-2)], understoodAs: 'Pull upward at 2.' },
    ];
    const merged = mergeCompilationResults(messages, results, state, context);
    expect(merged.messages.map(message => message.status)).toEqual(['ready', 'error', 'ready', 'ready']);
    expect(merged.messages[1].error).toBe('Unsupported color.');
    expect(merged.messages[2].understoodAs).toBe('Pull upward at 2.');
    expect(merged.messages[3]).toBe(outside);
    expect(merged.readyIds).toEqual(['a', 'c']); expect(merged.notice).toBe('2 ready · 1 needs editing.');
    expect(messages).toEqual(before); expect(state).toEqual(initialRules(gravityLab));
  });

  it('independently rejects a server result that targets a protected object', () => {
    const merged = mergeCompilationResults(drafts(), [
      { id: 'a', operations: [setY(1)] },
      { id: 'b', operations: [setY(50), { type: 'set_property', target: 'ball-A', property: 'friction', value: 0 }] },
      { id: 'c', operations: [{ type: 'reverse_gravity' }] },
    ], state, context);
    expect(merged.messages.map(message => message.status)).toEqual(['ready', 'error', 'ready']);
    expect(messageOperations(merged.messages[1])).toEqual([]);
    expect(merged.readyIds).toEqual(['a', 'c']);
    expect(state.acceleration.y).toBe(0);
  });

  it('clears old operations and correction data when re-preparing a ready row fails', () => {
    const old: Message = { id: 'a', text: 'old', status: 'ready', operation: setY(20), operations: [setY(20)], understoodAs: 'Previous meaning.' };
    const merged = mergeCompilationResults([old], [{ id: 'a', operations: [], error: 'Unsupported now.' }], state, context);
    expect(merged.messages[0].status).toBe('error'); expect(messageOperations(merged.messages[0])).toEqual([]);
    expect(merged.messages[0].understoodAs).toBeUndefined(); expect(merged.readyIds).toEqual([]);
    expect(merged.notice).toBe('0 ready · 1 needs editing.');
  });

  it('keeps all-error results local to their rows and does not invent ready operations', () => {
    const merged = mergeCompilationResults(drafts(), drafts().map(({ id }) => ({ id, operations: [], error: 'Unsupported.' })), state, context);
    expect(merged.readyIds).toEqual([]); expect(merged.messages.every(message => message.status === 'error')).toBe(true);
    expect(merged.notice).toBe('0 ready · 3 need editing.');
  });

  it('retains successful legacy responses and their numeric limits', () => {
    const merged = mergeCompilationResults(drafts().slice(0, 1), [{ id: 'a', operations: [setY(1000)] }], state, context);
    expect(merged.messages[0]).toMatchObject({ status: 'ready', adjustments: [{ requested: 1000, applied: 100 }] });
    expect(merged.notice).toBe('Ready when you are.');
  });
});
