/**
 * Integration Tests für API-Endpoints
 * Verwendet Mock-API Server für externe Dependencies
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';

const MOCK_API_URL = process.env.MOCK_API_URL || 'http://localhost:4001';
const API_URL = process.env.API_URL || 'http://localhost:3001';

describe('Integration Tests - API Endpoints', () => {
  beforeAll(async () => {
    // Warte auf Mock-API Server
    let retries = 10;
    while (retries > 0) {
      try {
        const response = await fetch(`${MOCK_API_URL}/health`);
        if (response.ok) break;
      } catch (error) {
        // Ignore
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries--;
    }
  });

  describe('Mock API Health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${MOCK_API_URL}/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('ok');
    });
  });

  describe('Chat API', () => {
    it('should create a conversation', async () => {
      const response = await fetch(`${MOCK_API_URL}/api/v1/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.thread_id).toBeDefined();
      expect(data.role).toBe('user');
    });

    it('should send a message', async () => {
      const response = await fetch(`${MOCK_API_URL}/api/v1/conversations/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: 'test-thread-123',
          message: 'Hello, AI!',
        }),
      });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.thread_id).toBeDefined();
      expect(data.message).toContain('Hello');
    });

    it('should return lipsync data', async () => {
      const response = await fetch(`${MOCK_API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          thread_id: 'test-thread-123',
        }),
      });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.lipsync).toBeDefined();
      expect(Array.isArray(data.lipsync)).toBe(true);
      expect(data.lipsync.length).toBeGreaterThan(0);
    });
  });

  describe('TTS API', () => {
    it('should generate TTS audio', async () => {
      const response = await fetch(`${MOCK_API_URL}/api/v1/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello, this is a test',
          voice_id: 'default',
        }),
      });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.audio_url).toBeDefined();
      expect(data.duration).toBeDefined();
    });
  });

  describe('Tool Config API', () => {
    it('should return search tool config', async () => {
      const response = await fetch(`${MOCK_API_URL}/api/v1/tools/search_tool_config`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.enabled).toBeDefined();
      expect(data.max_results).toBeDefined();
    });
  });
});

