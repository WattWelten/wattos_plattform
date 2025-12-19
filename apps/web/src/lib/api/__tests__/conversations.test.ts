/**
 * Conversations API Client Contract Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConversation, getConversation, sendMessage } from '../conversations';

// Mock fetch
global.fetch = vi.fn();

describe('Conversations API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a conversation', async () => {
      const mockResponse = {
        thread_id: 'test-thread-123',
        role: 'assistant',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createConversation({ role: 'assistant' }, 'test-token');
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/conversations'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should throw error on failure', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error creating conversation' }),
      });

      await expect(
        createConversation({ role: 'assistant' }, 'test-token'),
      ).rejects.toThrow();
    });
  });

  describe('getConversation', () => {
    it('should get a conversation', async () => {
      const mockResponse = {
        thread_id: 'test-thread-123',
        role: 'assistant',
        messages: [],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getConversation('test-thread-123', 'test-token');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const mockResponse = {
        thread_id: 'test-thread-123',
        role: 'assistant',
        message: 'Hello!',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sendMessage(
        { thread_id: 'test-thread-123', message: 'Hi' },
        'test-token',
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

