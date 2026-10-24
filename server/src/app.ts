import express from 'express';
import { ZodError } from 'zod';
import { fileURLToPath } from 'node:url';
import { compileRules } from './compiler';
import { CompilerError } from './ai-client';
import type { AiConfig } from './config';

export function createApp(config: AiConfig, fetcher?: typeof fetch) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/status', (_req, res) => res.json({ configured: Boolean(config.apiKey), model: config.model }));
  let active = 0;
  const requests = new Map<string, { start: number; count: number }>();
  app.post('/api/compile', async (req, res) => {
    const origin = req.get('origin');
    const allowed = new Set([`http://${req.get('host')}`, `https://${req.get('host')}`, ...(process.env.NODE_ENV !== 'production' ? ['http://127.0.0.1:5173', 'http://localhost:5173'] : []), ...(process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : [])]);
    if (origin && !allowed.has(origin)) { res.status(403).json({ error: 'Cross-origin compilation is not allowed.' }); return; }
    if (!req.is('application/json')) { res.status(415).json({ error: 'Send application/json.' }); return; }
    const now = Date.now(), ip = req.ip || 'local';
    for (const [key, value] of requests) if (now - value.start > 60000) requests.delete(key);
    const bucket = requests.get(ip) || { start: now, count: 0 };
    if (bucket.count >= 30 || active >= 4) { res.status(429).json({ error: 'Too many preparation requests. Try again shortly.' }); return; }
    bucket.count++; requests.set(ip, bucket); active++;
    const controller = new AbortController();
    const abort = () => { if (!res.writableEnded) controller.abort(); };
    req.once('aborted', abort); res.once('close', abort);
    res.set('Cache-Control', 'no-store');
    try { res.json(await compileRules(req.body, config, controller.signal, fetcher)); }
    catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof CompilerError) res.status(error.status).json({ error: error.message });
      else if (error instanceof ZodError) res.status(422).json({ error: 'The input or model rules did not pass validation. No rules were changed.' });
      else res.status(422).json({ error: error instanceof Error ? error.message.slice(0, 400) : 'Rule preparation failed.' });
    } finally { active--; req.off('aborted', abort); res.off('close', abort); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route.' }));
  app.use(express.static(fileURLToPath(new URL('../../site', import.meta.url)), { index: 'index.html', dotfiles: 'deny' }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const tooLarge = typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large';
    res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'The request is too large.' : 'Invalid JSON request.' });
  });
  return app;
}
