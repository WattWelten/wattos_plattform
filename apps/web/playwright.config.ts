import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['json', { outputFile: 'test-results/results.json' }]] : 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: 'test-results/',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Services werden manuell gestartet (pnpm dev:mvp)
  // Playwright verwendet vorhandene Server, startet keine neuen
  // webServer deaktiviert, wenn Services bereits laufen
  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : [
        {
          command: 'pnpm dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 180 * 1000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
        {
          command: 'cd ../gateway && pnpm dev',
          url: 'http://localhost:3001/api/health/liveness',
          reuseExistingServer: true,
          timeout: 180 * 1000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      ],
});

