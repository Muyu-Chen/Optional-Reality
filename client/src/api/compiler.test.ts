import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareWithAI } from './compiler';
import { initialRules } from '../levels/rules';
import { gravityLab } from '../levels/gravity-lab';

const input = { requestId: 'r1', levelId: 'gravity-lab', sceneVersion: 1, queueRevision: 3,
  messages: [{ id: 'm1', text: 'Turn off gravity' }], rules: initialRules(gravityLab) };
const output = { requestId: 'r1', levelId: 'gravity-lab', sceneVersion: 1, queueRevision: 3,
  messages: [{ id: 'm1', operations: [{ type: 'set_gravity', acceleration: 0 }] }] };
afterEach(() => vi.unstubAllGlobals());
describe('client compiler identity checks', () => {
  it('accepts the current queue response', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(output)));
    vi.stubGlobal('fetch', fetcher);
    expect((await prepareWithAI(input, new AbortController().signal)).messages[0].id).toBe('m1');
    expect(fetcher.mock.calls[0][1].headers).toMatchObject({ 'x-compiler-protocol': 'per-message-v1' });
  });
  it.each([{ queueRevision: 2 }, { sceneVersion: 0 }, { requestId: 'old' }, { levelId: 'other' }, { messages: [{ id: 'wrong', operations: output.messages[0].operations }] }])('rejects stale or mismatched output %#', async overrides => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...output, ...overrides }))));
    await expect(prepareWithAI(input, new AbortController().signal)).rejects.toThrow();
  });
  it('passes the cancellation signal and preserves the server error for missing keys', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Add AI_API_KEY' }), { status: 503 }));
    vi.stubGlobal('fetch', fetcher);
    const controller = new AbortController();
    await expect(prepareWithAI(input, controller.signal)).rejects.toThrow('Add AI_API_KEY');
    expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(false);
  });
  it('accepts mixed and all-error results while keeping every requested identity', async () => {
    const request = {...input,messages:[{id:'m1',text:'Valid.'},{id:'m2',text:'Unsupported.'}]};
    for(const messages of [
      [output.messages[0],{id:'m2',operations:[],error:'Unsupported message.'}],
      [{id:'m1',operations:[],error:'Unsupported message.'},{id:'m2',operations:[],error:'Unsupported message.'}],
    ]) {
      vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...output,messages})));
      expect((await prepareWithAI(request,new AbortController().signal)).messages).toEqual(messages);
    }
  });
  it.each([
    [{id:'m1',operations:[],error:''}],
    [{id:'m1',operations:output.messages[0].operations,error:'Cannot execute.'}],
    [{id:'m1',operations:[]}],
    [{id:'wrong',operations:[],error:'Unsupported message.'}],
  ])('rejects corrupted result structure or identity rather than assigning it to a row: %#', messages => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...output,messages})));
    return expect(prepareWithAI(input,new AbortController().signal)).rejects.toThrow();
  });
  it.each(['missing', 'duplicate', 'reordered'])('rejects a %s identity in an otherwise valid mixed batch', kind => {
    const request={...input,messages:['a','b','c'].map(id=>({id,text:'Message '+id}))};
    const messages=[{id:'a',operations:output.messages[0].operations},{id:'b',operations:[],error:'Unsupported.'},{id:'c',operations:output.messages[0].operations}];
    if(kind==='missing')messages.pop();
    else if(kind==='duplicate')messages[1]={...messages[1],id:'a'};
    else [messages[0],messages[1]]=[messages[1],messages[0]];
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({...output,messages})));
    return expect(prepareWithAI(request,new AbortController().signal)).rejects.toThrow('message IDs');
  });
});
