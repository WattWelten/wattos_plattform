import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TtsService } from '../tts.service';
import { EventBusService } from '../../../events/bus.service';
import { createMockEventBus } from '../../../__tests__/helpers/mocks';

describe('TtsService', () => {
  let ttsService: TtsService;
  let mockEventBus: EventBusService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    ttsService = new TtsService(mockEventBus);
  });

  describe('textToSpeech', () => {
    it('should convert text to speech', async () => {
      const audio = await ttsService.textToSpeech('Hello world', 'session-id', 'tenant-id');

      expect(audio).toBeInstanceOf(Buffer);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should accept language and voice parameters', async () => {
      const audio = await ttsService.textToSpeech(
        'Hello',
        'session-id',
        'tenant-id',
        'de',
        'voice-1',
      );

      expect(audio).toBeInstanceOf(Buffer);
    });
  });

  describe('streamTextToSpeech', () => {
    it('should stream text to speech', async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of ttsService.streamTextToSpeech(
        'Hello world',
        'session-id',
        'tenant-id',
      )) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('chunkTextForTTS', () => {
    it('should chunk text for TTS', () => {
      const text = 'This is a test. This is another sentence.';
      const chunks = (ttsService as any).chunkTextForTTS(text, 20);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every((chunk: string) => chunk.length > 0)).toBe(true);
    });
  });
});





