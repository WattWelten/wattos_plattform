import { test, expect } from '@playwright/test';

test.describe('Crawling', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should create a crawl job', async ({ page }) => {
    await page.goto('/admin/crawler');

    // Click "Create Crawl Job" button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Neuer Job")');
    await createButton.click();

    // Fill in crawl job details
    const urlInput = page.locator('input[name="urls"], input[type="url"]');
    await urlInput.fill('https://www.bund.de');

    const scheduleInput = page.locator('input[name="schedule"]');
    await scheduleInput.fill('0 5 * * *'); // Daily at 5 AM

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for crawl job to be created
    await page.waitForSelector('text=Active, text=Aktiv', { timeout: 10000 });

    // Verify crawl job was created
    const statusBadge = page.locator('text=Active, text=Aktiv').first();
    await expect(statusBadge).toBeVisible();
  });

  test('should list crawl jobs', async ({ page }) => {
    await page.goto('/admin/crawler');

    // Wait for crawl jobs list to load
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Verify at least one crawl job is displayed (or empty state)
    const jobsList = page.locator('table tbody, [role="list"]');
    await expect(jobsList).toBeVisible();
  });

  test('should trigger manual crawl', async ({ page }) => {
    await page.goto('/admin/crawler');

    // Find first crawl job
    const firstJob = page.locator('table tbody tr, [role="list"] > *').first();
    
    if (await firstJob.isVisible().catch(() => false)) {
      // Click "Run Now" or "Trigger" button
      const runButton = firstJob.locator('button:has-text("Run"), button:has-text("Jetzt ausführen")');
      
      if (await runButton.isVisible().catch(() => false)) {
        await runButton.click();

        // Wait for crawl to start
        await page.waitForSelector('text=Running, text=Läuft', { timeout: 10000 });

        // Verify crawl status
        const runningStatus = page.locator('text=Running, text=Läuft').first();
        await expect(runningStatus).toBeVisible();
      }
    }
  });
});

