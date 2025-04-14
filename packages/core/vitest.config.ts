import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createDefines } from './define.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ['src/**/*.test.[jt]s?(x)', 'tests/**/*.test.[jt]s?(x)'],
    root: __dirname,
    testTimeout: 30_000,
    restoreMocks: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      enabled: false,
      include: ['src'],
      exclude: ['**/*.stories.*'],
    },
  },
  resolve: {
    conditions: ['jsnext:source'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __INTERNAL_RSBUILD_IMAGE_OPTIONS__: { quality: 90 },
    ...createDefines({ test: true }),
  },
});
