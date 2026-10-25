export const PREPARATION_TIMEOUT_MS = 35_000;

/** Bound the complete request, even if a proxy or response body never settles. */
export async function withRequestDeadline<T>(request: (signal: AbortSignal) => Promise<T>, signal: AbortSignal, milliseconds = PREPARATION_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal.aborted) throw signal.reason;
  signal.addEventListener('abort', abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectAbort, { once: true });
    timer = setTimeout(() => controller.abort(new Error('AI took too long. Edit the message or prepare it again; ready messages can still be sent.')), milliseconds);
  });
  try { return await Promise.race([request(controller.signal), cancelled]); }
  finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', rejectAbort);
  }
}
