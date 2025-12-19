import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);
  private openai: OpenAI | null = null;
  private readonly defaultLanguage: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('voice.openaiApiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.defaultLanguage = this.configService.get<string>('voice.defaultLanguage', 'de');
  }

  /**
   * Speech zu Text konvertieren
   */
  async speechToText(dto: { audioData: string; language?: string; prompt?: string }): Promise<string> {
    const provider = this.configService.get<string>('voice.sttProvider', 'openai');

    switch (provider) {
      case 'openai':
      case 'whisper':
        return this.speechToTextOpenAI(dto);
      case 'azure':
        return this.speechToTextAzure(dto);
      default:
        throw new Error(`Unsupported STT provider: ${provider}`);
    }
  }

  /**
   * OpenAI Whisper STT (sehr schnell und genau)
   */
  private async speechToTextOpenAI(dto: { audioData: string; language?: string; prompt?: string }): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Base64 zu Buffer konvertieren
      const audioBuffer = Buffer.from(dto.audioData, 'base64');

      // File-like Object für Node.js erstellen (File API ist nur im Browser verfügbar)
      // OpenAI SDK akzeptiert File-like Objects mit stream() Methode
      const audioFile = {
        name: 'audio.webm',
        type: 'audio/webm',
        size: audioBuffer.length,
        stream: () => {
          const { Readable } = require('stream');
          return Readable.from([audioBuffer]);
        },
        arrayBuffer: async () => audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength),
        slice: (start?: number, end?: number) => {
          const sliced = audioBuffer.slice(start, end);
          return {
            ...audioFile,
            size: sliced.length,
            stream: () => {
              const { Readable } = require('stream');
              return Readable.from([sliced]);
            },
            arrayBuffer: async () => sliced.buffer.slice(sliced.byteOffset, sliced.byteOffset + sliced.byteLength),
          };
        },
      };

      const language = dto.language || this.defaultLanguage;

      const response = await this.openai.audio.transcriptions.create({
        file: audioFile as any,
        model: 'whisper-1',
        language: language,
        prompt: dto.prompt, // Optional: Kontext für bessere Erkennung
        response_format: 'text',
        temperature: 0.0, // Für konsistente Ergebnisse
      });

      const text = response as any;
      this.logger.debug(`STT result: ${text.substring(0, 100)}...`);
      return text;
    } catch (error: any) {
      this.logger.error(`OpenAI STT failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Azure STT (Fallback)
   */
  private async speechToTextAzure(dto: { audioData: string; language?: string; prompt?: string }): Promise<string> {
    // Azure STT Implementation (später erweiterbar)
    this.logger.warn('Azure STT not yet implemented, falling back to OpenAI');
    return this.speechToTextOpenAI(dto);
  }

  /**
   * Streaming STT (für Echtzeit-Gespräche)
   */
  async streamSpeechToText(audioStream: NodeJS.ReadableStream, language?: string): Promise<string> {
    // Für Streaming: Audio-Chunks sammeln und dann transkribieren
    // In Produktion: WebSocket-basiertes Streaming mit Whisper API
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      audioStream.on('end', async () => {
        try {
          const audioBuffer = Buffer.concat(chunks);
          const audioData = audioBuffer.toString('base64');
          const text = await this.speechToText({ audioData, language });
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });

      audioStream.on('error', reject);
    });
  }
}

