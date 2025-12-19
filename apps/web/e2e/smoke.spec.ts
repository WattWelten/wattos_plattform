/**
 * Smoke Tests
 * 
 * Basis-Tests für kritische Funktionalität
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/WattWeiser|WattOS/i);
  });

  test('avatar lab page loads', async ({ page }) => {
    await page.goto('/lab/avatar');
    // Check if page loads (might redirect to login)
    const url = page.url();
    expect(url.includes('/lab/avatar') || url.includes('/login')).toBeTruthy();
  });

  test('chat page accessible', async ({ page }) => {
    await page.goto('/de/chat');
    const url = page.url();
    // Should be on chat page or redirected to login
    expect(url.includes('/chat') || url.includes('/login')).toBeTruthy();
  });

  test('admin dashboard accessible', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const url = page.url();
    // Should be on admin page or redirected to login
    expect(url.includes('/admin') || url.includes('/login')).toBeTruthy();
  });
});

