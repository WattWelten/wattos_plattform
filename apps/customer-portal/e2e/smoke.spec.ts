import { test, expect } from '@playwright/test';

test.describe('Customer Portal Smoke Tests', () => {
  test('should load overview page', async ({ page }) => {
    await page.goto('/overview');
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible();
  });

  test('should navigate to conversations page', async ({ page }) => {
    await page.goto('/overview');
    
    // Click on Conversations link
    await page.getByRole('link', { name: /conversations/i }).click();
    
    // Check for conversations heading
    await expect(page.getByRole('heading', { name: /conversations/i })).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/overview');
    
    // Click on Settings link
    await page.getByRole('link', { name: /settings/i }).click();
    
    // Check for settings heading
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/overview');
    
    // Check that navigation links have proper ARIA attributes
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const ariaCurrent = await link.getAttribute('aria-current');
      // Links should either have aria-current="page" or not have it
      expect(ariaCurrent === null || ariaCurrent === 'page').toBeTruthy();
    }
  });
});



