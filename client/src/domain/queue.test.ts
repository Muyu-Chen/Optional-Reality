import { describe, expect, it } from 'vitest';
import { applyOperation, parseCommand } from '../../../shared/commands';
import { applyBatch, prepareMessage } from './queue';

describe('prepared command batches', () => {
  it('prepares two messages without applying either rule', () => {
    const messages = ['add gravity', 'stop gravity'].map((text, index) => prepareMessage(String(index), text));
    expect(messages.map(message => message.status)).toEqual(['ready', 'ready']);
    expect(messages[0].operation).toEqual({ type: 'set_gravity', acceleration: 1 });
    expect(messages[1].operation).toEqual({ type: 'set_gravity', acceleration: 0 });
  });
  it('sends batches separately and rejects sending a consumed message twice', () => {
    const original = [prepareMessage('a', 'add gravity'), prepareMessage('b', 'stop gravity')];
    const first = applyBatch(original, ['a'], 0, 120);
    expect(first.gravity).toBe(1);
    expect(first.messages.map(message => message.status)).toEqual(['sent', 'ready']);
    expect(first.events[0].tick).toBe(120);
    expect(original.map(message => message.status)).toEqual(['ready', 'ready']);
    expect(() => applyBatch(first.messages, ['a'], first.gravity, 121)).toThrow('Only ready');
    const second = applyBatch(first.messages, ['b'], first.gravity, 240);
    expect(second.gravity).toBe(0);
  });
  it('evaluates reverse against execution state, including previous operations in the same batch', () => {
    const messages = [prepareMessage('a', 'add gravity'), prepareMessage('r', 'reverse the gravity')];
    expect(applyBatch(messages, ['a', 'r'], 0, 10).gravity).toBe(-1);
    expect(applyBatch([messages[1]], ['r'], 3, 10).gravity).toBe(-3);
  });
  it('uses queue order even when selected IDs arrive in a different order', () => {
    const messages = [prepareMessage('a', 'add gravity'), prepareMessage('b', 'stop gravity')];
    const result = applyBatch(messages, ['b', 'a'], 0, 10);
    expect(result.gravity).toBe(0);
    expect(result.events.map(event => event.id)).toEqual(['a', 'b']);
  });
  it('does not mutate the queue when a batch includes an invalid, missing, or duplicate message', () => {
    const messages = [prepareMessage('a', 'add gravity'), prepareMessage('b', 'execute arbitrary JavaScript')];
    expect(() => applyBatch(messages, ['a', 'b'], 0, 0)).toThrow();
    expect(() => applyBatch(messages, ['missing'], 0, 0)).toThrow();
    expect(() => applyBatch(messages, ['a', 'a'], 0, 0)).toThrow();
    expect(messages.map(message => message.status)).toEqual(['ready', 'error']);
  });
  it('accepts stop/turn-off aliases and rejects automatic conditions and invalid numerical rules', () => {
    for (const text of ['stop gravity', 'turn off the gravity', 'gravity = 0']) {
      expect(parseCommand(text).operation).toEqual({ type: 'set_gravity', acceleration: 0 });
    }
    expect(parseCommand('turn off gravity when the ball leaves the track').error).toBeDefined();
    expect(() => applyOperation(0, { type: 'set_gravity', acceleration: Infinity })).toThrow();
    expect(applyOperation(0, { type: 'set_gravity', acceleration: 11 })).toBe(10);
    expect(Object.is(applyOperation(0, { type: 'reverse_gravity' }), -0)).toBe(false);
  });
});
