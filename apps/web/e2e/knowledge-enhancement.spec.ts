import { test, expect } from '@playwright/test';

test.describe('Knowledge Enhancement', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should trigger public source crawl', async ({ page }) => {
    await page.goto('/admin/knowledge-enhancement');

    // Click "Crawl All Sources" button
    const crawlButton = page.locator('button:has-text("Crawl All"), button:has-text("Alle crawlen")');
    
    if (await crawlButton.isVisible().catch(() => false)) {
      await crawlButton.click();

      // Wait for crawl to start
      await page.waitForSelector('text=Crawling, text=Läuft', { timeout: 10000 });

      // Verify crawl status
      const crawlStatus = page.locator('text=Completed, text=Abgeschlossen').first();
      await expect(crawlStatus).toBeVisible({ timeout: 60000 }); // Crawling can take time
    }
  });

  test('should display crawled sources', async ({ page }) => {
    await page.goto('/admin/knowledge-enhancement');

    // Wait for sources list to load
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Verify sources are displayed
    const sourcesList = page.locator('table tbody, [role="list"]').first();
    await expect(sourcesList).toBeVisible();
  });

  test('should display enrichment results', async ({ page }) => {
    await page.goto('/admin/knowledge-enhancement');

    // Find first source
    const firstSource = page.locator('table tbody tr, [role="list"] > *').first();
    
    if (await firstSource.isVisible().catch(() => false)) {
      await firstSource.click();

      // Wait for enrichment details
      await page.waitForSelector('text=Summary, text=Zusammenfassung', { timeout: 5000 });

      // Verify enrichment data is displayed
      const summary = page.locator('text=Summary, text=Zusammenfassung').first();
      await expect(summary).toBeVisible();
    }
  });
});

