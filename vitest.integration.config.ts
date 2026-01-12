import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.spec.ts', '**/*.integration.test.ts', '**/*.integration.spec.ts'],
    exclude: ['node_modules', 'dist', '.next'],
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.integration.setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@wattweiser/core': path.resolve(__dirname, './packages/core/src'),
      '@wattweiser/shared': path.resolve(__dirname, './packages/shared/src'),
      '@wattweiser/db': path.resolve(__dirname, './packages/db/src'),
      '@wattweiser/config': path.resolve(__dirname, './packages/config/src'),
      '@wattweiser/dashboard-service': path.resolve(__dirname, './apps/services/dashboard-service/src'),
    },
  },
});
