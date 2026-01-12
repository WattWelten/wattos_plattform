import { test, expect } from '@playwright/test';

/**
 * E2E Tests für Video-Avatar-Funktionalität im Web-App
 * 
 * Testet Avatar-Rendering und Recording-Funktionalität
 */
test.describe('Video Avatar - Web App', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant permissions für MediaRecorder API
    await context.grantPermissions(['camera', 'microphone']);
    
    // Mock MediaRecorder API (falls nicht verfügbar)
    await page.addInitScript(() => {
      if (!window.MediaRecorder) {
        // @ts-ignore
        window.MediaRecorder = class MockMediaRecorder {
          constructor(stream: MediaStream, options?: any) {
            this.stream = stream;
            this.options = options;
            this.state = 'inactive';
            this.mimeType = options?.mimeType || 'video/webm';
          }
          
          start() {
            this.state = 'recording';
            if (this.onstart) this.onstart(new Event('start'));
          }
          
          stop() {
            this.state = 'inactive';
            const blob = new Blob(['mock video data'], { type: this.mimeType });
            if (this.onstop) this.onstop(new Event('stop'));
            if (this.ondataavailable) {
              this.ondataavailable({ data: blob } as any);
            }
          }
          
          stream: MediaStream;
          options: any;
          state: string;
          mimeType: string;
          onstart: ((event: Event) => void) | null = null;
          onstop: ((event: Event) => void) | null = null;
          ondataavailable: ((event: any) => void) | null = null;
        };
      }
    });
  });

  test('sollte Avatar-Scene rendern können', async ({ page }) => {
    await page.goto('/lab/avatar');
    
    // Prüfe ob Avatar-Container vorhanden ist
    const avatarContainer = page.locator('[role="img"][aria-label*="Avatar"]');
    await expect(avatarContainer).toBeVisible({ timeout: 10000 });
  });

  test('sollte Canvas für Recording verfügbar sein', async ({ page }) => {
    await page.goto('/lab/avatar');
    
    // Warte auf Canvas
    await page.waitForTimeout(2000); // Warte auf Three.js Initialisierung
    
    // Prüfe ob Canvas vorhanden ist
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
    
    // Prüfe ob Canvas captureStream unterstützt
    const hasCaptureStream = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas && typeof canvas.captureStream === 'function';
    });
    
    expect(hasCaptureStream).toBe(true);
  });
});
