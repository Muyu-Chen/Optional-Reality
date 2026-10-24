import { config as dotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './app';
import { loadConfig } from './config';

dotenv({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
const config = loadConfig();
const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
createApp(config).listen(port, '127.0.0.1', () => {
  console.log(`Optional Reality: http://127.0.0.1:${port}/demo/ · ${config.apiKey ? 'AI configured' : 'AI key missing; local commands available'}`);
});
