import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextStreamingService } from '../streaming.service';
import { EventBusService } from '../../../events/bus.service';
import { createMockEventBus } from '../../../__tests__/helpers/mocks';

describe('TextStreamingService', () => {
  let streamingService: TextStreamingService;
  let mockEventBus: EventBusService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    streamingService = new TextStreamingService(mockEventBus);
  });

  describe('streamText', () => {
    it('should stream text word by word', async () => {
      const chunks: string[] = [];
      for await (const chunk of streamingService.streamText('Hello world', 'session-id', 'tenant-id')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Hello');
      expect(chunks.join('')).toContain('world');
    });

    it('should emit events for each chunk', async () => {
      const chunks: string[] = [];
      for await (const chunk of streamingService.streamText('Hello', 'session-id', 'tenant-id')) {
        chunks.push(chunk);
      }

      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });

  describe('chunkText', () => {
    it('should chunk text by size', () => {
      const text = 'This is a long text that needs to be chunked';
      const chunks = streamingService.chunkText(text, 10);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every((chunk) => chunk.length <= 10)).toBe(true);
    });

    it('should handle empty text', () => {
      const chunks = streamingService.chunkText('', 10);

      expect(chunks).toHaveLength(0);
    });
  });
});










































