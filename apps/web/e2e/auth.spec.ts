import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/de/login');
    await expect(page.getByRole('heading', { name: /anmelden/i })).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/de/login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.getByText(/anmeldung fehlgeschlagen|ungültige anmeldedaten/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simuliere Netzwerkfehler
    await page.route('**/api/auth/login', (route) => route.abort());
    
    await page.goto('/de/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Warte auf Fehlermeldung
    await expect(page.getByText(/netzwerkfehler|zeitüberschreitung/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle timeout errors', async ({ page }) => {
    // Simuliere Timeout
    await page.route('**/api/auth/login', (route) => {
      setTimeout(() => route.continue(), 35000); // Länger als 30s Timeout
    });
    
    await page.goto('/de/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Warte auf Timeout-Fehlermeldung
    await expect(page.getByText(/zeitüberschreitung/i)).toBeVisible({ timeout: 35000 });
  });

  test('should redirect to chat after successful login', async ({ page }) => {
    // Mock erfolgreichen Login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expiresIn: 3600,
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            roles: ['user'],
            tenantId: 'test-tenant',
          },
        }),
      });
    });

    await page.goto('/de/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Warte auf Redirect
    await page.waitForURL(/\/chat/, { timeout: 5000 });
    
    // Prüfe Token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBe('mock-access-token');
    
    // Prüfe User in localStorage
    const userStr = await page.evaluate(() => localStorage.getItem('wattweiser_user'));
    expect(userStr).toBeTruthy();
    if (userStr) {
      const user = JSON.parse(userStr);
      expect(user.email).toBe('test@example.com');
    }
  });

  test('should respect redirect query parameter', async ({ page }) => {
    // Mock erfolgreichen Login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expiresIn: 3600,
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            roles: ['user'],
            tenantId: 'test-tenant',
          },
        }),
      });
    });

    await page.goto('/de/login?redirect=/de/dashboard');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Warte auf Redirect zu Dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });
  });

  test('should store token in cookie for middleware', async ({ page }) => {
    // Mock erfolgreichen Login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expiresIn: 3600,
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            roles: ['user'],
            tenantId: 'test-tenant',
          },
        }),
      });
    });

    await page.goto('/de/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Warte auf Redirect
    await page.waitForURL(/\/chat/, { timeout: 5000 });
    
    // Prüfe Cookie
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find((c) => c.name === 'access_token');
    expect(accessTokenCookie).toBeTruthy();
    expect(accessTokenCookie?.value).toBe('mock-access-token');
  });
});

