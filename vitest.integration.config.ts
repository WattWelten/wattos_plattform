import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['scripts/**/*.test.ts', 'scripts/test-integration.ts'],
    testTimeout: 10000,
  },
});

