import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { devApiProxy } from './server/dev-api-proxy.ts';

export default defineConfig(({ mode }) => ({
  root: 'client',
  base: '/demo/',
  plugins: [react()],
  publicDir: false,
  server: {
    // Edits through the shared workspace do not always produce native file events.
    watch: { usePolling: true, interval: 300 },
    proxy: { '/api': devApiProxy(loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'DEV_API_').DEV_API_ORIGIN) },
  },
  build: {
    outDir: fileURLToPath(new URL('./site/demo', import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
}));
