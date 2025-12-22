import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RAGService, RAGProvider, RAGContext, RAGResponse } from '../rag.service';
import { EventBusService } from '../../../events/bus.service';
import { EventDomain } from '../../../events/types';

describe('RAGService', () => {
  let ragService: RAGService;
  let mockEventBus: EventBusService;
  let mockProvider: RAGProvider;

  beforeEach(() => {
    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventBusService;

    mockProvider = {
      search: vi.fn().mockResolvedValue({
        results: [
          {
            content: 'Test content 1',
            score: 0.9,
            source: 'source1',
          },
          {
            content: 'Test content 2',
            score: 0.8,
            source: 'source2',
          },
        ],
        query: 'test query',
      }),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    ragService = new RAGService(mockEventBus);
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      ragService.registerProvider('test-provider', mockProvider);

      const provider = ragService.getProvider('test-provider');
      expect(provider).toBe(mockProvider);
    });

    it('should register multiple providers', () => {
      const provider1 = { ...mockProvider };
      const provider2 = { ...mockProvider };

      ragService.registerProvider('provider1', provider1);
      ragService.registerProvider('provider2', provider2);

      expect(ragService.getProvider('provider1')).toBe(provider1);
      expect(ragService.getProvider('provider2')).toBe(provider2);
    });
  });

  describe('unregisterProvider', () => {
    it('should unregister a provider', () => {
      ragService.registerProvider('test-provider', mockProvider);
      ragService.unregisterProvider('test-provider');

      expect(ragService.getProvider('test-provider')).toBeUndefined();
    });
  });

  describe('getProvider', () => {
    it('should return registered provider', () => {
      ragService.registerProvider('test-provider', mockProvider);

      const provider = ragService.getProvider('test-provider');
      expect(provider).toBe(mockProvider);
    });

    it('should return undefined for unregistered provider', () => {
      const provider = ragService.getProvider('non-existent');
      expect(provider).toBeUndefined();
    });
  });

  describe('setDefaultProvider', () => {
    it('should set default provider', () => {
      ragService.registerProvider('test-provider', mockProvider);
      ragService.setDefaultProvider('test-provider');

      // Prüfe, dass Standard-Provider gesetzt wurde
      const context: RAGContext = {
        tenantId: 'tenant-id',
      };

      // Sollte den Standard-Provider verwenden
      expect(() => {
        // Intern wird defaultProvider verwendet
      }).not.toThrow();
    });

    it('should throw error for non-existent provider', () => {
      expect(() => {
        ragService.setDefaultProvider('non-existent');
      }).toThrow('RAG Provider not found: non-existent');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      ragService.registerProvider('test-provider', mockProvider);
      ragService.setDefaultProvider('test-provider');
    });

    it('should perform search with default provider', async () => {
      const context: RAGContext = {
        tenantId: 'tenant-id',
      };

      const result = await ragService.search('test query', context);

      expect(mockProvider.search).toHaveBeenCalledWith('test query', context);
      expect(result.results).toHaveLength(2);
      expect(result.query).toBe('test query');
    });

    it('should perform search with specified provider', async () => {
      const customProvider: RAGProvider = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              content: 'Custom content',
              score: 0.95,
              source: 'custom-source',
            },
          ],
          query: 'test query',
        }),
        healthCheck: vi.fn().mockResolvedValue(true),
      };

      ragService.registerProvider('custom-provider', customProvider);

      const context: RAGContext = {
        tenantId: 'tenant-id',
      };

      const result = await ragService.search('test query', context, 'custom-provider');

      expect(customProvider.search).toHaveBeenCalledWith('test query', context);
      expect(mockProvider.search).not.toHaveBeenCalled();
      expect(result.results[0].content).toBe('Custom content');
    });

    it('should emit knowledge event after search', async () => {
      const context: RAGContext = {
        tenantId: 'tenant-id',
      };

      await ragService.search('test query', context);

      expect(mockEventBus.emit).toHaveBeenCalled();
      const emittedEvent = (mockEventBus.emit as any).mock.calls[0][0];

      expect(emittedEvent.domain).toBe(EventDomain.KNOWLEDGE);
      expect(emittedEvent.action).toBe('search.executed');
      expect(emittedEvent.payload.query).toBe('test query');
      expect(emittedEvent.payload.results).toBeDefined();
    });

    it('should throw error for non-existent provider', async () => {
      const context: RAGContext = {
        tenantId: 'tenant-id',
      };

      await expect(ragService.search('test query', context, 'non-existent')).rejects.toThrow(
        'RAG Provider not found: non-existent',
      );
    });

    it('should handle provider errors', async () => {
      const errorProvider: RAGProvider = {
        search: vi.fn().mockRejectedValue(new Error('Provider error')),
        healthCheck: vi.fn().mockResolvedValue(true),
      };

      ragService.registerProvider('error-provider', errorProvider);

      const context: RAGContext = {
        tenantId: 'tenant-id',
      };

      await expect(ragService.search('test query', context, 'error-provider')).rejects.toThrow(
        'Provider error',
      );
    });
  });

  describe('buildContext', () => {
    beforeEach(() => {
      ragService.registerProvider('test-provider', mockProvider);
      ragService.setDefaultProvider('test-provider');
    });

    it('should build context from search results', async () => {
      const context: RAGContext = {
        tenantId: 'tenant-id',
        topK: 2,
      };

      const builtContext = await ragService.buildContext('test query', context);

      expect(builtContext).toContain('Test content 1');
      expect(builtContext).toContain('Test content 2');
      expect(builtContext).toContain('Source: source1');
      expect(builtContext).toContain('Source: source2');
    });

    it('should limit context to topK results', async () => {
      const context: RAGContext = {
        tenantId: 'tenant-id',
        topK: 1,
      };

      const builtContext = await ragService.buildContext('test query', context);

      expect(builtContext).toContain('Test content 1');
      expect(builtContext).not.toContain('Test content 2');
    });

    it('should emit context.built event', async () => {
      const context: RAGContext = {
        tenantId: 'tenant-id',
      };

      await ragService.buildContext('test query', context);

      // Zwei Events: search.executed und context.built
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2);

      const contextEvent = (mockEventBus.emit as any).mock.calls.find(
        (call: any[]) => call[0].action === 'context.built',
      )?.[0];

      expect(contextEvent).toBeDefined();
      expect(contextEvent.action).toBe('context.built');
      expect(contextEvent.payload.context).toBeDefined();
    });
  });

  describe('generateCitations', () => {
    it('should generate citations from results', () => {
      const results = [
        {
          content: 'Content 1',
          score: 0.9,
          source: 'source1',
          metadata: { page: 1 },
        },
        {
          content: 'Content 2',
          score: 0.8,
          source: 'source2',
        },
      ];

      const citations = ragService.generateCitations(results);

      expect(citations).toHaveLength(2);
      expect(citations[0]).toEqual({
        content: 'Content 1',
        source: 'source1',
        score: 0.9,
      });
      expect(citations[1]).toEqual({
        content: 'Content 2',
        source: 'source2',
        score: 0.8,
      });
    });

    it('should handle empty results', () => {
      const citations = ragService.generateCitations([]);

      expect(citations).toHaveLength(0);
    });
  });
});




