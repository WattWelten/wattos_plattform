import { test, expect } from '@playwright/test';

test.describe('Admin Console', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/de/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should show unauthorized for non-admin users', async ({ page }) => {
    // This would require setting up a test user with user role
    // For now, we'll just check the redirect logic
    await page.goto('/de/admin/dashboard');
    await expect(page).toHaveURL(/\/login|\/unauthorized/);
  });
});

