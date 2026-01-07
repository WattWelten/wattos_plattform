import { test, expect } from "@playwright/test";

test("Avatar+Chat lÃ¤dt & antwortet", async ({ page }) => {
  await page.goto("http://localhost:3000");
  // Canvas/Avatar sichtbar
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  // Chat-Eingabe vorhanden
  const input = page.getByPlaceholder(/frage|nachricht|schreiben|eingeben/i);
  await expect(input).toBeVisible();

  // Smoke: Nachricht senden (wenn Mock/Dev-Backend vorhanden)
  await input.fill("Hallo Kaya, was sind die Ã–ffnungszeiten der Kreisverwaltung?");
  await input.press("Enter");

  // Eine Chat-Blase mit Antwort erscheint (vereinfachter Check)
  const bubbles = page.locator("[data-testid='chat-bubble']");
  await expect(bubbles).toHaveCountGreaterThan(0);
});
