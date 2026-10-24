import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: 'client',
  base: '/demo/',
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: fileURLToPath(new URL('./site/demo', import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
