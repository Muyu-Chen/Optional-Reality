import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Local backups/prototypes can contain old tests; only test the active application.
    include: ['client/src/**/*.test.{ts,tsx}', 'shared/**/*.test.{ts,tsx}', 'server/src/**/*.test.{ts,tsx}'],
  },
});
