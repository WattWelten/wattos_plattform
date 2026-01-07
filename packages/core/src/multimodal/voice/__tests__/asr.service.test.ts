import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AsrService } from '../asr.service';
import { EventBusService } from '../../../events/bus.service';
import { createMockEventBus } from '../../../__tests__/helpers/mocks';

describe('AsrService', () => {
  let asrService: AsrService;
  let mockEventBus: EventBusService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    asrService = new AsrService(mockEventBus);
  });

  describe('speechToText', () => {
    it('should convert speech to text', async () => {
      const audioData = Buffer.from('audio data');
      const text = await asrService.speechToText(audioData, 'session-id', 'tenant-id');

      expect(text).toBe('Transcribed text');
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should accept language parameter', async () => {
      const audioData = Buffer.from('audio data');
      const text = await asrService.speechToText(audioData, 'session-id', 'tenant-id', 'en');

      expect(text).toBe('Transcribed text');
    });
  });

  describe('streamSpeechToText', () => {
    it('should stream speech to text', async () => {
      const audioStream = async function* () {
        yield Buffer.from('chunk1');
        yield Buffer.from('chunk2');
      };

      const texts: string[] = [];
      for await (const text of asrService.streamSpeechToText(
        audioStream(),
        'session-id',
        'tenant-id',
      )) {
        texts.push(text);
      }

      expect(texts.length).toBeGreaterThan(0);
    });
  });

  describe('interrupt', () => {
    it('should interrupt active stream', () => {
      // Simuliere aktiven Stream
      (asrService as any).activeStreams.set('session-id', new AbortController());

      asrService.interrupt('session-id');

      expect((asrService as any).activeStreams.has('session-id')).toBe(false);
    });

    it('should handle non-existent stream gracefully', () => {
      expect(() => {
        asrService.interrupt('non-existent');
      }).not.toThrow();
    });
  });
});










































