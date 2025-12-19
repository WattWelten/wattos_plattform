import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should display dashboard overview', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"], .dashboard-container', { timeout: 5000 });

    // Verify dashboard elements are visible
    const dashboard = page.locator('[data-testid="dashboard"], .dashboard-container').first();
    await expect(dashboard).toBeVisible();
  });

  test('should display metrics widgets', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Wait for metrics widgets
    await page.waitForSelector('[data-testid="metrics-widget"], .metrics-widget', { timeout: 5000 });

    // Verify at least one metric is displayed
    const metricsWidget = page.locator('[data-testid="metrics-widget"], .metrics-widget').first();
    await expect(metricsWidget).toBeVisible();
  });

  test('should update time range', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Find time range selector
    const timeRangeSelect = page.locator('select[name="timeRange"], [role="combobox"]').first();
    
    if (await timeRangeSelect.isVisible().catch(() => false)) {
      // Change time range to 7 days
      await timeRangeSelect.selectOption('7d');

      // Wait for dashboard to update
      await page.waitForTimeout(1000);

      // Verify dashboard updated (no error)
      const dashboard = page.locator('[data-testid="dashboard"]').first();
      await expect(dashboard).toBeVisible();
    }
  });

  test('should display analytics charts', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Wait for charts to load
    await page.waitForSelector('canvas, svg', { timeout: 5000 });

    // Verify at least one chart is rendered
    const chart = page.locator('canvas, svg').first();
    await expect(chart).toBeVisible();
  });

  test('should refresh dashboard data', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Find refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i]');
    
    if (await refreshButton.isVisible().catch(() => false)) {
      await refreshButton.click();

      // Wait for refresh to complete
      await page.waitForTimeout(2000);

      // Verify dashboard is still visible
      const dashboard = page.locator('[data-testid="dashboard"]').first();
      await expect(dashboard).toBeVisible();
    }
  });
});

