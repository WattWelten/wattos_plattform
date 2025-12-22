import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SourceCardsService } from '../source-cards.service';
import { EventBusService } from '../../events/bus.service';
import { ProfileService } from '../../profiles/profile.service';
import { RAGResult } from '../../knowledge/rag/rag.service';
import { createMockEventBus, createMockProfileService } from '../../__tests__/helpers/mocks';

describe('SourceCardsService', () => {
  let sourceCardsService: SourceCardsService;
  let mockEventBus: EventBusService;
  let mockProfileService: ProfileService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    mockProfileService = createMockProfileService();
    sourceCardsService = new SourceCardsService(mockEventBus, mockProfileService);
  });

  describe('createSourceCards', () => {
    it('should create source cards from RAG results', async () => {
      const ragResults: RAGResult[] = [
        {
          content: 'Test content',
          score: 0.9,
          source: 'source1',
          metadata: { documentName: 'Doc1', pageNumber: 1 },
        },
        {
          content: 'Another content',
          score: 0.8,
          source: 'source2',
        },
      ];

      const cards = await sourceCardsService.createSourceCards('tenant-id', 'session-id', ragResults);

      expect(cards).toHaveLength(2);
      expect(cards[0].content).toBe('Test content');
      expect(cards[0].source).toBe('source1');
      expect(cards[0].documentName).toBe('Doc1');
      expect(cards[0].pageNumber).toBe(1);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should return empty array when not required and no results', async () => {
      const cards = await sourceCardsService.createSourceCards('tenant-id', 'session-id', []);

      expect(cards).toHaveLength(0);
    });

    it('should emit missing event when required but no results', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        features: { sourceRequired: true },
      });

      await sourceCardsService.createSourceCards('tenant-id', 'session-id', []);

      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });

  describe('validateSourceCards', () => {
    it('should validate valid source cards', async () => {
      const cards = [
        {
          id: 'card-1',
          content: 'Content',
          source: 'source1',
          score: 0.9,
        },
      ];

      const result = await sourceCardsService.validateSourceCards('tenant-id', cards);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid cards', async () => {
      const cards = [
        {
          id: 'card-1',
          content: '',
          source: '',
          score: 1.5,
        },
      ];

      const result = await sourceCardsService.validateSourceCards('tenant-id', cards);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require cards when sourceRequired is true', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        features: { sourceRequired: true },
      });

      const result = await sourceCardsService.validateSourceCards('tenant-id', []);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Source cards are required but none provided');
    });
  });

  describe('formatSourceCardsForUI', () => {
    it('should format source cards for UI', () => {
      const cards = [
        {
          id: 'card-1',
          content: 'Content',
          source: 'source1',
          score: 0.9,
          documentName: 'Doc1',
          documentUrl: 'https://example.com/doc1',
          pageNumber: 1,
        },
      ];

      const citations = sourceCardsService.formatSourceCardsForUI(cards);

      expect(citations).toHaveLength(1);
      expect(citations[0].title).toBe('Doc1');
      expect(citations[0].content).toBe('Content');
      expect(citations[0].url).toBe('https://example.com/doc1');
      expect(citations[0].metadata?.pageNumber).toBe(1);
    });

    it('should use source as title when documentName is missing', () => {
      const cards = [
        {
          id: 'card-1',
          content: 'Content',
          source: 'source1',
          score: 0.9,
        },
      ];

      const citations = sourceCardsService.formatSourceCardsForUI(cards);

      expect(citations[0].title).toBe('source1');
    });
  });
});




