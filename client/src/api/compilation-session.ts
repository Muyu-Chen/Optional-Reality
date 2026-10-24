export interface CompilationTicket {
  readonly signal: AbortSignal;
  readonly sceneVersion: number;
  readonly queueRevision: number;
}

// A queue edit or scene restart invalidates every response from the old snapshot,
// even when a provider finishes after its request has been aborted.
export class CompilationSession {
  private sceneVersion = 0;
  private queueRevision = 0;
  private active: { ticket: CompilationTicket; controller: AbortController } | null = null;

  begin(): CompilationTicket | null {
    if (this.active) return null;
    const controller = new AbortController();
    const ticket = {
      signal: controller.signal,
      sceneVersion: this.sceneVersion,
      queueRevision: this.queueRevision,
    };
    this.active = { ticket, controller };
    return ticket;
  }

  isCurrent(ticket: CompilationTicket) {
    return this.active?.ticket === ticket && !ticket.signal.aborted
      && ticket.sceneVersion === this.sceneVersion && ticket.queueRevision === this.queueRevision;
  }

  finish(ticket: CompilationTicket) {
    if (!this.isCurrent(ticket)) return false;
    this.active = null;
    return true;
  }

  cancel() {
    this.active?.controller.abort();
    this.active = null;
  }

  queueChanged() {
    this.queueRevision++;
    this.cancel();
  }

  sceneChanged() {
    this.sceneVersion++;
    this.cancel();
  }
}
