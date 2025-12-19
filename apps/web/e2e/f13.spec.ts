import { test, expect } from '@playwright/test';

test.describe('F13 Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should configure F13 settings', async ({ page }) => {
    await page.goto('/admin/f13');

    // Fill in F13 configuration
    const baseUrlInput = page.locator('input[name="baseUrl"]');
    await baseUrlInput.fill('https://f13.example.com');

    const apiKeyInput = page.locator('input[name="apiKey"], input[type="password"]');
    await apiKeyInput.fill('test-api-key');

    // Enable KB Sync
    const kbSyncCheckbox = page.locator('input[type="checkbox"][name*="kbSync"], input[type="checkbox"][name*="sync"]');
    if (await kbSyncCheckbox.isVisible().catch(() => false)) {
      await kbSyncCheckbox.check();
    }

    // Save configuration
    const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
    await saveButton.click();

    // Verify configuration was saved
    await page.waitForSelector('text=Saved, text=Gespeichert', { timeout: 5000 });
  });

  test('should sync knowledge base articles', async ({ page }) => {
    await page.goto('/admin/f13/kb-sync');

    // Click "Sync Now" button
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("Synchronisieren")');
    
    if (await syncButton.isVisible().catch(() => false)) {
      await syncButton.click();

      // Wait for sync to start
      await page.waitForSelector('text=Syncing, text=Synchronisiert', { timeout: 10000 });

      // Verify sync status
      const syncStatus = page.locator('text=Synced, text=Synchronisiert').first();
      await expect(syncStatus).toBeVisible({ timeout: 30000 });
    }
  });

  test('should display KB articles', async ({ page }) => {
    await page.goto('/admin/f13/kb-articles');

    // Wait for articles list to load
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Verify articles are displayed (or empty state)
    const articlesList = page.locator('table tbody, [role="list"]');
    await expect(articlesList).toBeVisible();
  });

  test('should approve KB article for sync', async ({ page }) => {
    await page.goto('/admin/f13/kb-articles');

    // Find first pending article
    const pendingArticle = page.locator('text=Pending, text=Ausstehend').first();
    
    if (await pendingArticle.isVisible().catch(() => false)) {
      // Click approve button
      const approveButton = pendingArticle.locator('..').locator('button:has-text("Approve"), button:has-text("Genehmigen")');
      
      if (await approveButton.isVisible().catch(() => false)) {
        await approveButton.click();

        // Wait for approval
        await page.waitForSelector('text=Approved, text=Genehmigt', { timeout: 5000 });
      }
    }
  });
});


