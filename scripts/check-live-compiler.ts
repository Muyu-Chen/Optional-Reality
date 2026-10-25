// Explicit, paid provider check; never part of npm test. Do not log credentials/envelopes.
// Run: npx tsx scripts/check-live-compiler.ts
import { config as dotenv } from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compileRules } from '../server/src/compiler';
import { loadConfig } from '../server/src/config';
import { levels } from '../client/src/levels/catalog';
import { initialRules } from '../client/src/levels/rules';
import type { Operation } from '../shared/rules';
import { CompileResponseSchema, type CompileRequest } from '../shared/compiler';
import { normalizeAccelerationOperation } from '../shared/acceleration';

dotenv({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const config = loadConfig();
const endpoint = process.env.LIVE_COMPILER_URL;
if (endpoint) {
  const url = new URL(endpoint);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('Use an HTTPS compile endpoint (or local HTTP), without credentials or query strings.');
} else if (!config.apiKey) throw new Error(`Configure the server-side ${config.apiKeyEnv} before this manual check.`);

async function throughRelay(input: CompileRequest) {
  const response = await fetch(endpoint!, { method: 'POST', headers: { 'content-type': 'application/json', 'x-compiler-protocol': 'per-message-v1', origin: new URL(endpoint!).origin },
    body: JSON.stringify(input), signal: AbortSignal.timeout(45000) });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${response.status}`);
  const output = CompileResponseSchema.parse(body);
  if (output.requestId !== input.requestId || output.levelId !== input.levelId || output.sceneVersion !== input.sceneVersion || output.queueRevision !== input.queueRevision || output.messages.length !== input.messages.length || output.messages.some((message, index) => message.id !== input.messages[index].id)) throw new Error('Relay returned mismatched request identity.');
  return output;
}

const set = (property: 'gravity' | 'acceleration_x' | 'restitution' | 'friction' | 'fan_power', value: number, target = 'world'): Operation => ({ type: 'set_property', target, property, value });
const cases = [
  { text: 'add accelation to right', operations: [set('acceleration_x', 1)] },
  { text: 'Could you make the enviroment accelrate to the right at 1 m/s²?', operations: [set('acceleration_x', 1)] },
  { text: '横着往左拉一点吧，水平加速度设成 0.5 米每秒平方。', operations: [set('acceleration_x', -.5)] },
  { text: 'Turn gravity off, but leave the horizontal acceleration unchanged.', operations: [set('gravity', 0)] },
  { text: 'Make the sideways acceleration twice as strong.', operations: [{ type: 'scale_property', target: 'world', property: 'acceleration_x', factor: 2 } as Operation] },
  { text: 'Make all the surfaces bouncy with a restitution of 0.8.', operations: [set('restitution', .8)] },
  { text: '地面太滑了，把全局摩擦系数设为 0.3。', operations: [set('friction', .3)] },
  { text: 'Switch off gravity and add a rightward acceleration of 2 m/s².', operations: [set('gravity', 0), set('acceleration_x', 2)] },
  { text: '给环境一个往上 0.75 米每秒平方的加速度。', operations: [set('gravity', -.75)] },
  { text: 'Please accelerate everything towards the left with magnitude 0.25 m/s².', operations: [set('acceleration_x', -.25)] },
  { text: 'Set gravity downward to 20 m/s².', operations: [set('gravity',20)] },
  { text: '向上的浮力', operations: [set('gravity', -1)] },
  { text: '让小球向上浮起来', operations: [set('gravity', -1)] },
  { text: 'Give everything upward buoyancy.', operations: [set('gravity', -1)] },
  { text: '向上的浮力 0.75 米每秒平方', operations: [set('gravity', -.75)] },
];
const reports: { level: string; kind: string; passed: boolean; milliseconds: number; cases?: number; error?: string; cacheHitTokens?: number; cacheMissTokens?: number }[] = [];
const details: unknown[] = [];
function canonical(operations: readonly Operation[]) {
  return operations.map(normalizeAccelerationOperation)
    .map(operation => JSON.stringify(operation, Object.keys(operation).sort())).sort();
}
async function check(levelId: string, tests: { text: string; operations: Operation[] }[], rejection = false, kind = 'shared') {
  const level = levels.find(item => item.id === levelId)!;
  const rules = initialRules(level);
  rules.acceleration.x = 1;
  const input = { requestId: crypto.randomUUID(), levelId, sceneVersion: 1, queueRevision: 1,
    rules, messages: tests.map((test, index) => ({ id: `m${index}`, text: test.text })) };
  let usage: { prompt_cache_hit_tokens?: number; prompt_cache_miss_tokens?: number } = {};
  const capture: typeof fetch = async (url, init) => {
    const response = await fetch(url, init);
    try { usage = (await response.clone().json()).usage ?? {}; } catch { /* compiler reports malformed envelopes */ }
    return response;
  };
  const start = performance.now();
  let passed = false, error: string | undefined;
  try {
    const output = endpoint ? await throughRelay(input) : await compileRules(input, config, undefined, capture);
    passed = output.messages.every((message, index) => rejection ? 'error' in message && !message.operations.length
      : !('error' in message) && JSON.stringify(canonical(message.operations)) === JSON.stringify(canonical(tests[index].operations)));
    details.push({ levelId, tests, output });
    if (!passed) error = rejection ? 'Expected rejection, received valid operations.' : 'Operations did not match expected meaning.';
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'Compilation failed.';
    // A provider/network/config failure is not a successful semantic rejection.
    passed = false;
    details.push({ levelId, tests, error });
  }
  const report = { level: levelId, kind, passed, milliseconds: Math.round(performance.now() - start), cases: tests.length,
    ...(error ? { error } : {}), cacheHitTokens: usage.prompt_cache_hit_tokens, cacheMissTokens: usage.prompt_cache_miss_tokens };
  reports.push(report);
  console.log(JSON.stringify(report));
}

for (const level of levels) await check(level.id, cases);
await check('breeze', [{ text: 'Crank the fan power up to 10, please.', operations: [set('fan_power', 2, 'fan-main')] }], false, 'device-clamp');
await check('catch-cup', [{ text: 'Make the cup bottom completely unbouncy.', operations: [set('restitution', 0, 'cup-base')] }], false, 'named-surface');
for (const text of ['Teleport the ball straight into the exit.', 'Add acceleration to the left and right at the same time.', 'Set fan power to 1.',
  'Give the ball an upward buoyancy of 5 newtons.', 'Set the ball upward velocity to 2 m/s.',
  'Add a water tank and calculate buoyancy from water density and displaced volume.']) {
  await check('gravity-lab', [{ text, operations: [] }], true, 'unsupported');
}
const destination = fileURLToPath(new URL('../.localwork/live-api-check/', import.meta.url));
await mkdir(destination, { recursive: true, mode: 0o700 });
await writeFile(`${destination}/${endpoint ? 'report-relay' : 'report'}.json`, JSON.stringify({ date: new Date().toISOString(), endpoint, model: config.model, reports, details }, null, 2), { mode: 0o600 });
const failed = reports.filter(report => !report.passed);
console.log(JSON.stringify({ checks: reports.length, messages: reports.reduce((sum, item) => sum + item.cases!, 0), failed: failed.length }));
if (failed.length) process.exitCode = 1;
