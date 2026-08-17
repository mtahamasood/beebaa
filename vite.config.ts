/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    // Playwright owns tests/e2e; vitest must not pick up its *.spec.ts files.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
