import { describe, expect, it } from 'vitest';
import { CompileResponseSchema, validateCompilation, type CompileRequest } from './compiler';
import { initialRules, ruleContext } from '../client/src/levels/rules';
import { gravityLab } from '../client/src/levels/gravity-lab';

const context = ruleContext(gravityLab);
const request = (): CompileRequest => ({ requestId: 'r', levelId: gravityLab.id, sceneVersion: 2, queueRevision: 4,
  rules: initialRules(gravityLab), messages: ['a', 'b', 'c'].map(id => ({ id, text: `Original ${id}` })),
});
const success = (id: string) => ({ id, operations: [{ type: 'set_gravity', acceleration: 1 }], error: null });
const failure = (id: string) => ({ id, operations: [], error: 'The ball color is protected.' });

describe('batch compilation with independent message results', () => {
  it('returns every identity and valid rows around a model rejection, with correctly matched corrections', () => {
    const input = request(), before = structuredClone(input);
    const output = validateCompilation(input, { messages: [success('a'), failure('b'), { ...success('c'), understoodAs: 'Original c' }] }, context);
    expect(output).toMatchObject({ requestId: 'r', sceneVersion: 2, queueRevision: 4, messages: [
      { id: 'a', operations: [{ value: 1 }] }, { id: 'b', operations: [], error: 'The ball color is protected.' }, { id: 'c', operations: [{ value: 1 }] },
    ] });
    expect(output.messages[2]).not.toHaveProperty('understoodAs');
    expect(CompileResponseSchema.safeParse(output).success).toBe(true); expect(input).toEqual(before);
  });

  it.each([
    { id: 'b', operations: [{ type: 'eval', code: 'never execute' }], error: null },
    { id: 'b', operations: [{ type: 'set_property', target: 'ball-A', property: 'friction', value: 0 }], error: null },
    { id: 'b', operations: [] , error: null },
    { id: 'b' },
    { id: 'b', operations: 'invalid', error: null },
  ])('isolates a malformed or forbidden message without dropping its neighbours: %#', bad => {
    const output = validateCompilation(request(), { messages: [success('a'), bad, success('c')] }, context);
    expect(output.messages.map(message => 'error' in message)).toEqual([false, true, false]);
    expect(output.messages[1]).toMatchObject({ id: 'b', operations: [], error: expect.any(String) });
  });

  it('accepts a batch where every message is rejected as individual outcomes', () => {
    const output = validateCompilation(request(), { messages: ['a', 'b', 'c'].map(failure) }, context);
    expect(output.messages.every(message => 'error' in message)).toBe(true);
  });

  it.each([
    { messages: [success('a'), success('b')] },
    { messages: [success('a'), success('a'), success('c')] },
    { messages: [success('b'), success('a'), success('c')] },
    { messages: [success('a'), success('unknown'), success('c')] },
    { messages: [success('a'), { operations: [] }, success('c')] },
    { messages: 'invalid' },
    { messages: [success('a'), success('b'), success('c')], extra: true },
  ])('rejects the whole response when its envelope or identity cannot be trusted: %#', output => {
    const input = request(), before = structuredClone(input);
    expect(() => validateCompilation(input, output, context)).toThrow(); expect(input).toEqual(before);
  });
});
