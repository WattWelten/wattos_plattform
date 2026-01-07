/**
 * Vitest Setup fÃ¼r packages/agents
 * 
 * Mockt AbhÃ¤ngigkeiten fÃ¼r Tests, die nicht in der Test-Umgebung verfÃ¼gbar sind
 */

import { vi } from 'vitest';

// Mock fÃ¼r ConfigService
vi.mock('@nestjs/config', () => ({
  ConfigService: vi.fn().mockImplementation(() => ({
    get: vi.fn((key: string, defaultValue?: any) => defaultValue),
  })),
}));

// Mock fÃ¼r EventBusService und RAGService aus @wattweiser/core
vi.mock('@wattweiser/core', () => {
  const mockEventBus = {
    emit: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
    subscribePattern: vi.fn(),
    unsubscribe: vi.fn(),
    healthCheck: vi.fn().mockResolvedValue(true),
  };

  const mockRAGProvider = {
    search: vi.fn().mockResolvedValue({
      results: [],
      query: '',
      metadata: {},
    }),
    healthCheck: vi.fn().mockResolvedValue(true),
  };

  const mockRAGService = {
    registerProvider: vi.fn(),
    unregisterProvider: vi.fn(),
    getProvider: vi.fn().mockReturnValue(mockRAGProvider),
    setDefaultProvider: vi.fn(),
    search: vi.fn().mockResolvedValue({
      results: [],
      query: '',
      metadata: {},
    }),
    buildContext: vi.fn().mockResolvedValue(''),
    generateCitations: vi.fn().mockReturnValue([]),
    healthCheck: vi.fn().mockResolvedValue(true),
  };

  // Registriere Standard-Provider
  mockRAGService.registerProvider('wattweiser', mockRAGProvider);

  return {
    EventBusService: vi.fn().mockImplementation(() => mockEventBus),
    RAGService: vi.fn().mockImplementation(() => mockRAGService),
  };
});
