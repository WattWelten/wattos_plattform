import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { TextToSpeechDto } from './dto/text-to-speech.dto';
import { firstValueFrom } from 'rxjs';
import OpenAI from 'openai';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private openai: OpenAI | null = null;
  private readonly defaultVoice: string;
  private readonly defaultLanguage: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const apiKey = this.configService.get<string>('voice.openaiApiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.defaultVoice = this.configService.get<string>('voice.defaultVoice', 'alloy');
    this.defaultLanguage = this.configService.get<string>('voice.defaultLanguage', 'de');
  }

  /**
   * Text zu Speech konvertieren
   */
  async textToSpeech(dto: TextToSpeechDto): Promise<Buffer> {
    const provider = dto.provider || this.configService.get<string>('voice.ttsProvider', 'openai');

    switch (provider) {
      case 'openai':
        return this.textToSpeechOpenAI(dto);
      case 'elevenlabs':
        return this.textToSpeechElevenLabs(dto);
      case 'azure':
        return this.textToSpeechAzure(dto);
      default:
        throw new Error(`Unsupported TTS provider: ${provider}`);
    }
  }

  /**
   * OpenAI TTS
   */
  private async textToSpeechOpenAI(dto: TextToSpeechDto): Promise<Buffer> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const voice = dto.voice || this.defaultVoice;
      const language = dto.language || this.defaultLanguage;

      const response = await this.openai.audio.speech.create({
        model: 'tts-1', // tts-1 für schnell, tts-1-hd für höhere Qualität
        voice: voice as any,
        input: dto.text,
        language: language,
        response_format: 'mp3',
        speed: 1.0, // Für schnelle Gespräche kann auf 1.2-1.5 erhöht werden
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      this.logger.debug(`Generated TTS audio: ${buffer.length} bytes`);
      return buffer;
    } catch (error: any) {
      this.logger.error(`OpenAI TTS failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * ElevenLabs TTS (für sehr schnelle, natürliche Stimmen)
   */
  private async textToSpeechElevenLabs(dto: TextToSpeechDto): Promise<Buffer> {
    const apiKey = this.configService.get<string>('voice.elevenlabsApiKey');
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const voiceId = dto.voice || '21m00Tcm4TlvDq8ikWAM'; // Default ElevenLabs voice
      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            text: dto.text,
            model_id: 'eleven_turbo_v2_5', // Turbo-Model für schnelle Gespräche
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          },
          {
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
          },
        ),
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(`ElevenLabs TTS failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Azure TTS (Fallback)
   */
  private async textToSpeechAzure(dto: TextToSpeechDto): Promise<Buffer> {
    // Azure TTS Implementation (später erweiterbar)
    this.logger.warn('Azure TTS not yet implemented, falling back to OpenAI');
    return this.textToSpeechOpenAI(dto);
  }

  /**
   * Streaming TTS (für Echtzeit-Gespräche)
   */
  async streamTextToSpeech(dto: TextToSpeechDto): Promise<NodeJS.ReadableStream> {
    const provider = dto.provider || this.configService.get<string>('voice.ttsProvider', 'openai');

    if (provider === 'openai' && this.openai) {
      try {
        const voice = dto.voice || this.defaultVoice;
        const language = dto.language || this.defaultLanguage;

        const response = await this.openai.audio.speech.create({
          model: 'tts-1', // Schnelles Modell
          voice: voice as any,
          input: dto.text,
          language: language,
          response_format: 'mp3',
          speed: 1.2, // Erhöhte Geschwindigkeit für schnelle Gespräche
        });

        // Stream zurückgeben
        return response.body as any;
      } catch (error: any) {
        this.logger.error(`OpenAI streaming TTS failed: ${error.message}`);
        throw error;
      }
    }

    // Fallback: Non-streaming
    const buffer = await this.textToSpeech(dto);
    const { Readable } = require('stream');
    return Readable.from([buffer]);
  }
}














