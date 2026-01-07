import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../events/bus.service';
import { EventDomain, PerceptionEventSchema } from '../../events/types';
import { v4 as uuid } from 'uuid';

/**
 * ASR (Automatic Speech Recognition) Service
 * 
 * Verwaltet Speech-to-Text mit Streaming-Support und Barge-in
 */
@Injectable()
export class AsrService {
  private readonly logger = new Logger(AsrService.name);
  private activeStreams: Map<string, AbortController> = new Map();

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Audio zu Text konvertieren (nicht-streaming)
   */
  async speechToText(
    audioData: Buffer,
    sessionId: string,
    tenantId: string,
    language?: string,
  ): Promise<string> {
    // TODO: Integration mit STT-Provider (OpenAI Whisper, etc.)
    this.logger.debug(`Processing STT for session: ${sessionId}`);

    // Emit Perception Event
    const event = PerceptionEventSchema.parse({
      id: uuid(),
      type: 'perception.audio.received',
      domain: EventDomain.PERCEPTION,
      action: 'audio.received',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      payload: {
        data: audioData.toString('base64'),
        format: 'audio/wav',
        language: language || 'de',
      },
    });

    await this.eventBus.emit(event);

    // Placeholder - wird durch echte STT-Integration ersetzt
    return 'Transcribed text';
  }

  /**
   * Streaming STT mit Barge-in Support
   */
  async *streamSpeechToText(
    audioStream: AsyncIterable<Buffer>,
    sessionId: string,
    tenantId: string,
    language?: string,
  ): AsyncGenerator<string> {
    const abortController = new AbortController();
    this.activeStreams.set(sessionId, abortController);

    try {
      for await (const chunk of audioStream) {
        if (abortController.signal.aborted) {
          break;
        }

        // TODO: Streaming STT-Processing
        const text = await this.speechToText(chunk, sessionId, tenantId, language);
        yield text;
      }
    } finally {
      this.activeStreams.delete(sessionId);
    }
  }

  /**
   * Barge-in: Aktuellen Stream abbrechen
   */
  interrupt(sessionId: string): void {
    const controller = this.activeStreams.get(sessionId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(sessionId);
      this.logger.debug(`Stream interrupted for session: ${sessionId}`);
    }
  }

  /**
   * Transcribe (Alias für speechToText)
   */
  async transcribe(
    audioData: Buffer,
    sessionId: string,
    tenantId: string,
    language?: string,
  ): Promise<string> {
    return this.speechToText(audioData, sessionId, tenantId, language);
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return this.eventBus !== undefined;
    } catch {
      return false;
    }
  }
}

