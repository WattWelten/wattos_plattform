import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../events/bus.service';
import { EventDomain, IntentEventSchema } from '../../events/types';
import { v4 as uuid } from 'uuid';

/**
 * Text Streaming Service
 * 
 * Verwaltet Text-Streaming für Echtzeit-Kommunikation
 */
@Injectable()
export class TextStreamingService {
  // private readonly logger = new Logger(TextStreamingService.name);

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Text streamen
   */
  async *streamText(text: string, sessionId: string, tenantId: string): AsyncGenerator<string> {
    const words = text.split(' ');
    
    for (const word of words) {
      yield word + ' ';
      
      // Emit Event für jeden Chunk
      const event = IntentEventSchema.parse({
        id: uuid(),
        type: 'intent.message.processed',
        domain: EventDomain.INTENT,
        action: 'message.processed',
        timestamp: Date.now(),
        sessionId,
        tenantId,
        payload: {
          message: word,
        },
      });

      await this.eventBus.emit(event);
    }
  }

  /**
   * Text in Chunks aufteilen
   */
  chunkText(text: string, chunkSize: number = 50): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

