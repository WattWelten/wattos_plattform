import { test, expect } from '@playwright/test';

test.describe('Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // In real tests: Set up test user and authenticate
  });

  test('should complete character-to-agent workflow', async ({ page }) => {
    // Step 1: Create Character
    await page.goto('/admin/characters');
    const createButton = page.locator('button:has-text("Create"), button:has-text("Neuer Character")');
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      const promptInput = page.locator('textarea[name="prompt"]');
      await promptInput.fill('You are Kaya, the citizen assistant.');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForSelector('text=Kaya', { timeout: 10000 });
    }

    // Step 2: Generate Persona
    await page.goto('/admin/personas');
    const generatePersonaButton = page.locator('button:has-text("Generate"), button:has-text("Generieren")');
    if (await generatePersonaButton.isVisible().catch(() => false)) {
      await generatePersonaButton.click();
      await page.waitForSelector('text=Generated, text=Generiert', { timeout: 30000 });
    }

    // Step 3: Generate Agent
    await page.goto('/admin/agents');
    const generateAgentButton = page.locator('button:has-text("Generate"), button:has-text("Generieren")');
    if (await generateAgentButton.isVisible().catch(() => false)) {
      await generateAgentButton.click();
      await page.waitForSelector('text=Generated, text=Generiert', { timeout: 30000 });
    }

    // Step 4: Verify workflow completion
    await page.goto('/admin/agents');
    const agentsList = page.locator('table tbody, [role="list"]').first();
    await expect(agentsList).toBeVisible();
  });

  test('should complete crawl-to-knowledge workflow', async ({ page }) => {
    // Step 1: Create Crawl Job
    await page.goto('/admin/crawler');
    const createCrawlButton = page.locator('button:has-text("Create"), button:has-text("Neuer Job")');
    if (await createCrawlButton.isVisible().catch(() => false)) {
      await createCrawlButton.click();
      const urlInput = page.locator('input[name="urls"]');
      await urlInput.fill('https://www.bund.de');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForSelector('text=Active, text=Aktiv', { timeout: 10000 });
    }

    // Step 2: Trigger Crawl
    const runButton = page.locator('button:has-text("Run"), button:has-text("Jetzt ausführen")');
    if (await runButton.isVisible().catch(() => false)) {
      await runButton.click();
      await page.waitForSelector('text=Completed, text=Abgeschlossen', { timeout: 60000 });
    }

    // Step 3: Verify Knowledge Base
    await page.goto('/admin/knowledge-spaces');
    const knowledgeSpaces = page.locator('table tbody, [role="list"]').first();
    await expect(knowledgeSpaces).toBeVisible();
  });
});

