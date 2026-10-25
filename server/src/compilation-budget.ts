import { CompilerError } from './ai-client';

// A provider may ignore abort or stall while reading its body. The caller still
// settles within the shared initial+repair deadline and releases its listener.
export async function withCompilationSignal<T>(signal: AbortSignal, run: () => Promise<T>, caller?: AbortSignal): Promise<T> {
  const interrupted = () => caller?.aborted ? new CompilerError('Preparation cancelled.', 499)
    : new CompilerError('The model request timed out. Your messages and current rules are unchanged.', 504);
  if (signal.aborted) throw interrupted();
  let cancel = () => {};
  const deadline = new Promise<never>((_, reject) => {
    cancel = () => reject(interrupted());
    signal.addEventListener('abort', cancel, { once: true });
  });
  try { return await Promise.race([run(), deadline]); }
  finally { signal.removeEventListener('abort', cancel); }
}
