import { vi } from 'vitest';
import type { RAGProvider, RAGContext, RAGResponse, RAGResult } from '@wattweiser/shared';
import { EventBusService } from './src/events/bus.service';

// Mock EventBusService
const mockEventBusService = {
  emit: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  healthCheck: vi.fn().mockResolvedValue(true),
};

// Mock RAG Provider
const mockRAGProvider: RAGProvider = {
  search: vi.fn().mockResolvedValue({
    results: [] as RAGResult[],
    query: '',
    metadata: {},
  }),
  healthCheck: vi.fn().mockResolvedValue(true),
};

// Mock RAG Service
const mockRAGService = {
  registerProvider: vi.fn(),
  unregisterProvider: vi.fn(),
  setDefaultProvider: vi.fn(),
  getProvider: vi.fn().mockReturnValue(mockRAGProvider),
  search: vi.fn().mockResolvedValue({
    results: [] as RAGResult[],
    query: '',
    metadata: {},
  }),
  buildContext: vi.fn().mockResolvedValue(''),
  generateCitations: vi.fn().mockReturnValue([]),
  healthCheck: vi.fn().mockResolvedValue(true),
};

// Registriere Standard-Provider
mockRAGService.registerProvider('wattweiser', mockRAGProvider);

// Exportiere Mocks fÃ¼r Tests
vi.mock('./src/events/bus.service', () => ({
  EventBusService: vi.fn().mockImplementation(() => mockEventBusService),
}));

export { mockRAGProvider, mockRAGService, mockEventBusService };
