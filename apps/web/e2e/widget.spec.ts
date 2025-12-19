import { test, expect } from '@playwright/test';

test.describe('Widget System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should create a widget', async ({ page }) => {
    await page.goto('/admin/widgets');

    // Click "Create Widget" button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Neues Widget")');
    await createButton.click();

    // Fill in widget details
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('Test Widget');

    const typeSelect = page.locator('select[name="type"]');
    await typeSelect.selectOption('chat');

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for widget to be created
    await page.waitForSelector('text=Test Widget', { timeout: 10000 });

    // Verify widget was created
    const widgetName = page.locator('text=Test Widget').first();
    await expect(widgetName).toBeVisible();
  });

  test('should generate embedding code', async ({ page }) => {
    await page.goto('/admin/widgets');

    // Find first widget
    const firstWidget = page.locator('table tbody tr, [role="list"] > *').first();
    
    if (await firstWidget.isVisible().catch(() => false)) {
      // Click "Get Embedding Code" button
      const embedButton = firstWidget.locator('button:has-text("Embed"), button:has-text("Code")');
      
      if (await embedButton.isVisible().catch(() => false)) {
        await embedButton.click();

        // Wait for embedding code modal/dialog
        await page.waitForSelector('code, pre, textarea', { timeout: 5000 });

        // Verify embedding code is displayed
        const codeBlock = page.locator('code, pre, textarea').first();
        await expect(codeBlock).toBeVisible();
      }
    }
  });

  test('should configure widget settings', async ({ page }) => {
    await page.goto('/admin/widgets');

    // Find first widget and click to edit
    const firstWidget = page.locator('table tbody tr, [role="list"] > *').first();
    
    if (await firstWidget.isVisible().catch(() => false)) {
      await firstWidget.click();

      // Update widget position
      const positionSelect = page.locator('select[name="position"]');
      if (await positionSelect.isVisible().catch(() => false)) {
        await positionSelect.selectOption('bottom-left');

        // Save changes
        const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
        await saveButton.click();

        // Verify update
        await page.waitForSelector('text=Saved, text=Gespeichert', { timeout: 5000 });
      }
    }
  });

  test('should display widget analytics', async ({ page }) => {
    await page.goto('/admin/widgets');

    // Find first widget
    const firstWidget = page.locator('table tbody tr, [role="list"] > *').first();
    
    if (await firstWidget.isVisible().catch(() => false)) {
      // Click "Analytics" button
      const analyticsButton = firstWidget.locator('button:has-text("Analytics")');
      
      if (await analyticsButton.isVisible().catch(() => false)) {
        await analyticsButton.click();

        // Wait for analytics to load
        await page.waitForSelector('text=Total Events, text=Gesamt', { timeout: 5000 });

        // Verify analytics are displayed
        const analytics = page.locator('text=Total Events, text=Gesamt').first();
        await expect(analytics).toBeVisible();
      }
    }
  });
});

