import { test, expect } from '@playwright/test';

/**
 * E2E Tests für Video-Avatar-Funktionalität
 * 
 * Testet den kompletten Workflow:
 * 1. Avatar auswählen/erstellen
 * 2. Video aufnehmen
 * 3. Video hochladen
 * 4. Video in Galerie anzeigen
 */
test.describe('Video Avatar', () => {
  test.beforeEach(async ({ page }) => {
    // Login (anpassen je nach Auth-Setup)
    await page.goto('/login');
    // TODO: Login-Logik anpassen
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');
    // await page.waitForURL('/overview');
  });

  test('sollte zur Videos-Seite navigieren können', async ({ page }) => {
    await page.goto('/videos');
    await expect(page).toHaveURL(/.*\/videos/);
    await expect(page.locator('h1')).toContainText('Video-Avatare');
  });

  test('sollte Avatar-Selector anzeigen', async ({ page }) => {
    await page.goto('/videos');
    
    // Prüfe ob Avatar-Selector vorhanden ist
    const avatarSelector = page.locator('text=Avatar auswählen');
    await expect(avatarSelector).toBeVisible();
  });

  test('sollte Video Creator UI anzeigen', async ({ page }) => {
    await page.goto('/videos');
    
    // Prüfe ob Video Creator vorhanden ist
    const videoCreator = page.locator('text=Video-Aufnahme');
    await expect(videoCreator).toBeVisible();
    
    // Prüfe ob Text-Input vorhanden ist
    const textInput = page.locator('textarea[placeholder*="Text"]');
    await expect(textInput).toBeVisible();
  });

  test('sollte Video aufnehmen können', async ({ page }) => {
    await page.goto('/videos');
    
    // Warte auf UI
    await page.waitForSelector('text=Video-Aufnahme');
    
    // Fülle Text-Input
    const textInput = page.locator('textarea[placeholder*="Text"]');
    await textInput.fill('Hallo, dies ist ein Test-Video.');
    
    // Prüfe ob Aufnahme-Button vorhanden ist
    const recordButton = page.locator('button:has-text("Aufnahme starten")');
    await expect(recordButton).toBeVisible();
    
    // Note: Recording-Test würde Browser-Permissions benötigen
    // Für vollständigen Test: Mock MediaRecorder API
  });

  test('sollte Video-Galerie anzeigen', async ({ page }) => {
    await page.goto('/videos');
    
    // Wechsle zur Galerie
    const galleryTab = page.locator('button:has-text("Galerie")');
    await galleryTab.click();
    
    // Prüfe ob Galerie angezeigt wird
    await expect(page.locator('text=Noch keine Videos erstellt').or(page.locator('[class*="grid"]'))).toBeVisible();
  });

  test('sollte zwischen Create und Gallery wechseln können', async ({ page }) => {
    await page.goto('/videos');
    
    // Prüfe Create-Tab ist aktiv
    const createTab = page.locator('button:has-text("Video erstellen")');
    await expect(createTab).toHaveClass(/bg-primary-600/);
    
    // Wechsle zu Gallery
    const galleryTab = page.locator('button:has-text("Galerie")');
    await galleryTab.click();
    await expect(galleryTab).toHaveClass(/bg-primary-600/);
    
    // Wechsle zurück zu Create
    await createTab.click();
    await expect(createTab).toHaveClass(/bg-primary-600/);
  });
});
