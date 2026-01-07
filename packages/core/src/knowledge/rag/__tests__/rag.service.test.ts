import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGService } from '../rag.service';
import type { RAGProvider, RAGContext, RAGResponse } from '@wattweiser/shared';
import { EventBusService } from '../../../events/bus.service';

describe('RAGService', () => {
  let ragService: RAGService;
  let mockEventBus: EventBusService;
  let mockRAGProvider: RAGProvider;

  beforeEach(() => {
    // EventBus mocken
    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventBusService;

    // RAGProvider korrekt mocken - jede Methode muss eine echte Funktion sein
    mockRAGProvider = {
      search: vi.fn(),
      healthCheck: vi.fn(),
    };

    ragService = new RAGService(mockEventBus);
  });

  describe('healthCheck', () => {
    it('should return true when provider is healthy', async () => {
      // Arrange
      vi.mocked(mockRAGProvider.healthCheck).mockResolvedValue(true);
      ragService.registerProvider('wattweiser', mockRAGProvider);
      ragService.setDefaultProvider('wattweiser');

      // Act
      const result = await ragService.healthCheck();

      // Assert
      expect(result).toBe(true);
      expect(mockRAGProvider.healthCheck).toHaveBeenCalled();
    });

    it('should return false when provider is unhealthy', async () => {
      // Arrange
      vi.mocked(mockRAGProvider.healthCheck).mockResolvedValue(false);
      ragService.registerProvider('wattweiser', mockRAGProvider);
      ragService.setDefaultProvider('wattweiser');

      // Act
      const result = await ragService.healthCheck();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when no default provider is set', async () => {
      // Act
      const result = await ragService.healthCheck();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      // Act
      ragService.registerProvider('test-provider', mockRAGProvider);

      // Assert
      expect(ragService.getProvider('test-provider')).toBe(mockRAGProvider);
    });
  });

  describe('setDefaultProvider', () => {
    it('should set default provider', () => {
      // Arrange
      ragService.registerProvider('test-provider', mockRAGProvider);

      // Act
      ragService.setDefaultProvider('test-provider');

      // Assert
      expect(() => ragService.setDefaultProvider('test-provider')).not.toThrow();
    });

    it('should throw error when provider does not exist', () => {
      // Act & Assert
      expect(() => ragService.setDefaultProvider('non-existent')).toThrow(
        'RAG Provider not found: non-existent'
      );
    });
  });

  describe('search', () => {
    it('should perform search with default provider', async () => {
      // Arrange
      const mockResponse: RAGResponse = {
        results: [
          {
            content: 'Test content',
            score: 0.9,
            source: 'test-source',
          },
        ],
        query: 'test query',
      };

      vi.mocked(mockRAGProvider.search).mockResolvedValue(mockResponse);
      ragService.registerProvider('wattweiser', mockRAGProvider);
      ragService.setDefaultProvider('wattweiser');

      const context: RAGContext = {
        tenantId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      };

      // Act
      const result = await ragService.search('test query', context);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockRAGProvider.search).toHaveBeenCalledWith('test query', context);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should throw error when provider not found', async () => {
      // Arrange
      const context: RAGContext = {
        tenantId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      };

      // Act & Assert
      await expect(ragService.search('test query', context)).rejects.toThrow(
        'RAG Provider not found: wattweiser'
      );
    });
  });

  describe('buildContext', () => {
    it('should build context from search results', async () => {
      // Arrange
      const mockResponse: RAGResponse = {
        results: [
          {
            content: 'First result',
            score: 0.9,
            source: 'source1',
          },
          {
            content: 'Second result',
            score: 0.8,
            source: 'source2',
          },
        ],
        query: 'test query',
      };

      vi.mocked(mockRAGProvider.search).mockResolvedValue(mockResponse);
      ragService.registerProvider('wattweiser', mockRAGProvider);
      ragService.setDefaultProvider('wattweiser');

      const context: RAGContext = {
        tenantId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        topK: 2,
      };

      // Act
      const result = await ragService.buildContext('test query', context);

      // Assert
      expect(result).toContain('[1] First result');
      expect(result).toContain('[2] Second result');
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2); // search + buildContext events
    });
  });

  describe('generateCitations', () => {
    it('should generate citations from results', () => {
      // Arrange
      const results = [
        {
          content: 'Test content',
          score: 0.9,
          source: 'test-source',
        },
      ];

      // Act
      const citations = ragService.generateCitations(results);

      // Assert
      expect(citations).toEqual([
        {
          content: 'Test content',
          source: 'test-source',
          score: 0.9,
        },
      ]);
    });
  });
});
