import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['**/*.integration.test.ts', '**/*.integration.spec.ts'],
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
});
