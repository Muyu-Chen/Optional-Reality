import { afterEach, describe, expect, it, vi } from 'vitest';
import { withRequestDeadline } from './request-deadline';

afterEach(()=>vi.useRealTimers());
describe('bounded AI waiting',()=>{
  it('times out even when the underlying request ignores cancellation',async()=>{
    vi.useFakeTimers();let requestSignal:AbortSignal|undefined;
    const result=withRequestDeadline(signal=>{requestSignal=signal;return new Promise(()=>{});},new AbortController().signal,100);
    const failed=expect(result).rejects.toThrow('AI took too long');
    await vi.advanceTimersByTimeAsync(100);await failed;
    expect(requestSignal?.aborted).toBe(true);expect(vi.getTimerCount()).toBe(0);
  });
  it('propagates cancellation, rejects a stale result, and cleans up its deadline',async()=>{
    vi.useFakeTimers();const owner=new AbortController();let signal:AbortSignal|undefined;
    let resolve!:(value:number)=>void;
    const result=withRequestDeadline(s=>{signal=s;return new Promise<number>(r=>{resolve=r;});},owner.signal,100);
    const failed=expect(result).rejects.toThrow('cancelled');owner.abort(new Error('cancelled'));await failed;
    resolve(42);expect(signal?.aborted).toBe(true);expect(vi.getTimerCount()).toBe(0);
  });
  it('does not call an already-cancelled request and clears deadlines after success or failure',async()=>{
    vi.useFakeTimers();const owner=new AbortController();owner.abort(new Error('already cancelled'));
    const request=vi.fn(async()=>42);
    await expect(withRequestDeadline(request,owner.signal)).rejects.toThrow('already cancelled');expect(request).not.toHaveBeenCalled();
    await expect(withRequestDeadline(request,new AbortController().signal)).resolves.toBe(42);
    await expect(withRequestDeadline(async()=>{throw new Error('offline');},new AbortController().signal)).rejects.toThrow('offline');
    expect(vi.getTimerCount()).toBe(0);
  });
});
