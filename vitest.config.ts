import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/index.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    pool: 'threads',
  },
  resolve: {
    alias: {
      '@wattweiser/core': path.resolve(__dirname, './packages/core/src'),
      '@wattweiser/shared': path.resolve(__dirname, './packages/shared/src'),
      '@wattweiser/db': path.resolve(__dirname, './packages/db/src'),
      '@wattweiser/config': path.resolve(__dirname, './packages/config/src'),
    },
  },
});

