import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: 'client',
  base: '/demo/',
  plugins: [react()],
  publicDir: false,
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  build: {
    outDir: fileURLToPath(new URL('./site/demo', import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
