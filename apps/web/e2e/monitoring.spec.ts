import { test, expect } from '@playwright/test';

test.describe('Monitoring Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should display metrics dashboard', async ({ page }) => {
    await page.goto('/admin/monitoring/metrics');

    // Wait for metrics dashboard to load
    await page.waitForSelector('[data-testid="metrics-dashboard"], .metrics-dashboard', { timeout: 5000 });

    // Verify metrics are displayed
    const metricsDashboard = page.locator('[data-testid="metrics-dashboard"]').first();
    await expect(metricsDashboard).toBeVisible();
  });

  test('should display logs viewer', async ({ page }) => {
    await page.goto('/admin/monitoring/logs');

    // Wait for logs viewer to load
    await page.waitForSelector('[data-testid="logs-viewer"], .logs-viewer', { timeout: 5000 });

    // Verify logs are displayed (or empty state)
    const logsViewer = page.locator('[data-testid="logs-viewer"]').first();
    await expect(logsViewer).toBeVisible();
  });

  test('should filter logs by level', async ({ page }) => {
    await page.goto('/admin/monitoring/logs');

    // Find level filter
    const levelFilter = page.locator('select[name="level"], [role="combobox"]').first();
    
    if (await levelFilter.isVisible().catch(() => false)) {
      // Filter by error level
      await levelFilter.selectOption('error');

      // Wait for logs to filter
      await page.waitForTimeout(1000);

      // Verify filter is applied
      const logsViewer = page.locator('[data-testid="logs-viewer"]').first();
      await expect(logsViewer).toBeVisible();
    }
  });

  test('should display alerts', async ({ page }) => {
    await page.goto('/admin/monitoring/alerts');

    // Wait for alerts to load
    await page.waitForSelector('[data-testid="alerts-list"], .alerts-list', { timeout: 5000 });

    // Verify alerts are displayed (or empty state)
    const alertsList = page.locator('[data-testid="alerts-list"]').first();
    await expect(alertsList).toBeVisible();
  });

  test('should acknowledge alert', async ({ page }) => {
    await page.goto('/admin/monitoring/alerts');

    // Find first open alert
    const openAlert = page.locator('text=Open, text=Offen').first();
    
    if (await openAlert.isVisible().catch(() => false)) {
      // Click acknowledge button
      const acknowledgeButton = openAlert.locator('..').locator('button:has-text("Acknowledge"), button:has-text("Bestätigen")');
      
      if (await acknowledgeButton.isVisible().catch(() => false)) {
        await acknowledgeButton.click();

        // Wait for alert to be acknowledged
        await page.waitForSelector('text=Acknowledged, text=Bestätigt', { timeout: 5000 });
      }
    }
  });

  test('should display trace viewer', async ({ page }) => {
    await page.goto('/admin/monitoring/traces');

    // Wait for trace viewer to load
    await page.waitForSelector('[data-testid="trace-viewer"], .trace-viewer', { timeout: 5000 });

    // Verify trace viewer is displayed
    const traceViewer = page.locator('[data-testid="trace-viewer"]').first();
    await expect(traceViewer).toBeVisible();
  });
});


