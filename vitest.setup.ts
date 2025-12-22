import { vi, beforeEach, afterEach } from 'vitest';

// Globale Mock-Konfiguration
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});




