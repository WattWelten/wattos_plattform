import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { TtsService } from '../tts/tts.service';
import { SttService } from '../stt/stt.service';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class VoiceStreamingService {
  private readonly logger = new Logger(VoiceStreamingService.name);
  private readonly lowLatencyMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly ttsService: TtsService,
    private readonly sttService: SttService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {
    this.lowLatencyMode = this.configService.get<boolean>('voice.lowLatencyMode', false);
  }

  /**
   * Schnelles Voice-Gespräch: STT → Chat → TTS
   */
  async processVoiceConversation(
    audioData: string,
    conversationId: string,
    language?: string,
  ): Promise<{ audioResponse: Buffer; textResponse: string }> {
    try {
      // 1. STT: Audio zu Text
      this.logger.debug('Processing STT...');
      const userText = await this.sttService.speechToText({
        audioData,
        language,
      });

      if (!userText || userText.trim().length === 0) {
        throw new Error('No speech detected');
      }

      // 2. Chat-Service: Text zu Antwort
      this.logger.debug('Sending to chat service...');
      const chatServiceUrl = this.serviceDiscovery.getServiceUrl('chat-service', 3006);
      const chatResponse = await firstValueFrom(
        this.httpService.post(`${chatServiceUrl}/v1/conversations/message`, {
          thread_id: conversationId,
          message: userText,
          model: 'gpt-4',
          provider: 'openai',
        }),
      );

      const assistantText = chatResponse.data.content || chatResponse.data.message || '';

      // 3. TTS: Antwort zu Audio (mit optimierten Einstellungen für schnelle Gespräche)
      this.logger.debug('Generating TTS...');
      const audioResponse = await this.ttsService.textToSpeech({
        text: assistantText,
        language,
        streaming: false,
        voice: this.lowLatencyMode ? 'nova' : undefined, // Nova ist schneller
      });

      return {
        audioResponse,
        textResponse: assistantText,
      };
    } catch (error: any) {
      this.logger.error(`Voice conversation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Streaming Voice-Gespräch (WebSocket-basiert)
   */
  async streamVoiceConversation(
    audioStream: NodeJS.ReadableStream,
    conversationId: string,
    language?: string,
  ): Promise<NodeJS.ReadableStream> {
    // Für echte Streaming-Gespräche:
    // 1. Audio-Chunks sammeln
    // 2. Bei Pause: STT → Chat → TTS
    // 3. TTS-Stream zurückgeben

    // Vereinfachte Implementierung: Gesamten Stream verarbeiten
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      audioStream.on('end', async () => {
        try {
          const audioBuffer = Buffer.concat(chunks);
          const audioData = audioBuffer.toString('base64');
          const result = await this.processVoiceConversation(audioData, conversationId, language);
          const { Readable } = require('stream');
          resolve(Readable.from([result.audioResponse]));
        } catch (error) {
          reject(error);
        }
      });

      audioStream.on('error', reject);
    });
  }
}





