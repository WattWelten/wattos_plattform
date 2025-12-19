import { test, expect } from '@playwright/test';

test.describe('Character Setup', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should create a character from prompt', async ({ page }) => {
    await page.goto('/admin/characters');

    // Click "Create Character" button
    const createButton = page.locator('button:has-text("Create Character"), button:has-text("Neuer Character")');
    await createButton.click();

    // Fill in character prompt
    const promptInput = page.locator('textarea[name="prompt"], textarea[placeholder*="prompt" i]');
    await promptInput.fill('You are Kaya, the citizen assistant for Landkreis Oldenburg. You help citizens with questions about services, forms, and local information.');

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Erstellen")');
    await submitButton.click();

    // Wait for character to be created
    await page.waitForSelector('text=Kaya', { timeout: 10000 });

    // Verify character was created
    const characterName = page.locator('text=Kaya').first();
    await expect(characterName).toBeVisible();
  });

  test('should list all characters', async ({ page }) => {
    await page.goto('/admin/characters');

    // Wait for characters list to load
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Verify at least one character is displayed
    const characterList = page.locator('table tbody tr, [role="list"] > *').first();
    await expect(characterList).toBeVisible();
  });

  test('should update character configuration', async ({ page }) => {
    await page.goto('/admin/characters');

    // Click on first character (if exists)
    const firstCharacter = page.locator('table tbody tr, [role="list"] > *').first();
    if (await firstCharacter.isVisible().catch(() => false)) {
      await firstCharacter.click();

      // Update character name
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Updated Character Name');
        
        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Speichern")');
        await saveButton.click();

        // Verify update
        await expect(page.locator('text=Updated Character Name')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

