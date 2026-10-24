import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import type { CompileRequest } from '../../../shared/compiler';
import type { Operation } from '../../../shared/rules';
import type { PhysicsWorld } from '../physics/world';
import App from '../App';

interface TestLab { world: PhysicsWorld; report: () => void; destroyed: boolean }
const fixtures = vi.hoisted(() => ({ labs: [] as TestLab[] }));

// Keep the real Matter world and React tree. Only replace browser drawing and RAF
// so tests can advance simulation time explicitly and deterministically.
vi.mock('../physics/canvas-lab', async () => {
  const { PhysicsWorld } = await import('../physics/world');
  return { CanvasLab: class {
    world: PhysicsWorld;
    destroyed = false;
    constructor(_canvas: unknown, readonly level: PhysicsWorld['level'], private emit: (state: ReturnType<PhysicsWorld['snapshot']>) => void) {
      this.world = new PhysicsWorld(level);
      fixtures.labs.push(this);
      this.report();
    }
    report() { this.emit(this.world.snapshot()); }
    reset() {
      const seen = this.world.seenTutorials;
      this.world.destroy();
      this.world = new PhysicsWorld(this.level, seen);
      this.report();
    }
    destroy() { this.destroyed = true; this.world.destroy(); }
  } };
});

interface PendingRequest {
  request: CompileRequest;
  signal: AbortSignal;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}

export class ControlledApi {
  pending: PendingRequest[] = [];
  configured = true;
  fetch = vi.fn<typeof fetch>(async (url, init) => {
    if (url === '/api/status') return Response.json({ configured: this.configured, model: 'test-model' });
    if (url !== '/api/compile') throw new Error(`Unexpected test network request: ${url}`);
    // Intentionally allow late responses after abort: not every provider cancels.
    return new Promise<Response>((resolve, reject) => this.pending.push({
      request: JSON.parse(String(init?.body)), signal: init!.signal!, resolve, reject,
    }));
  });

  async complete(index: number, operations: Operation[]) {
    const pending = this.pending[index];
    const { requestId, levelId, sceneVersion, queueRevision, messages } = pending.request;
    await act(async () => pending.resolve(Response.json({
      requestId, levelId, sceneVersion, queueRevision,
      messages: messages.map(({ id }) => ({ id, operations })),
    })));
  }

  async respond(index: number, response: Response) {
    await act(async () => this.pending[index].resolve(response));
  }
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/demo/');
  fixtures.labs = [];
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

export async function startGame(level = 'gravity-lab', api = new ControlledApi()) {
  window.history.replaceState(null, '', `/demo/?level=${level}`);
  vi.stubGlobal('fetch', api.fetch);
  const view = render(<App />, { reactStrictMode: true });
  await act(async () => {});
  return { ...view, api };
}

export const lab = () => fixtures.labs.at(-1)!;
export const button = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name });
export const rows = () => screen.queryAllByRole('article');
export async function click(name: string) { await act(async () => fireEvent.click(button(name))); }
export async function queue(text: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  await act(async () => fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' }));
}
export async function manage() { if (screen.queryByRole('button', { name: 'Manage' })) await click('Manage'); }
export async function advance(ticks: number) {
  await act(async () => {
    for (let i = 0; i < ticks; i++) lab().world.step();
    lab().report();
  });
}
