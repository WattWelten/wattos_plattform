import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Config fÃ¼r E2E Tests
 * 
 * Testet Dashboard-Service Ã¼ber Gateway
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI 
    ? [['html'], ['json', { outputFile: 'test-results/e2e-results.json' }]] 
    : 'html',
  use: {
    baseURL: process.env.GATEWAY_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: 'test-results/e2e/',
  timeout: 30000, // 30s Timeout pro Test

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web-Server fÃ¼r Tests (optional - wenn Services nicht laufen)
  webServer: [
    {
      command: 'cd ../.. && pnpm dev:mvp',
      url: 'http://localhost:3001/api/health/liveness',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    },
  ],
});
