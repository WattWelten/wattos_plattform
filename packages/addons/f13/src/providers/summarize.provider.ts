import { Injectable, Logger } from '@nestjs/common';
import { F13Client } from '../client';

/**
 * Summary Options
 */
export interface SummaryOptions {
  maxLength?: number;
  minLength?: number;
  language?: string;
  style?: 'concise' | 'detailed' | 'bullet-points';
}

/**
 * F13 Summary Provider
 *
 * Adapter für F13 Summary API
 */
@Injectable()
export class F13SummaryProvider {
  private readonly logger = new Logger(F13SummaryProvider.name);

  constructor(private readonly f13Client: F13Client) {}

  /**
   * Text zusammenfassen mit Fallback-Logik
   */
  async summarize(
    text: string,
    options?: SummaryOptions & {
      fallback?: () => Promise<string>;
    }
  ): Promise<string> {
    try {
      this.logger.debug('F13 summary', { textLength: text.length });

      try {
        // F13 Summary API Call
        const response = await this.f13Client.post('/summary/summarize', {
          text,
          max_length: options?.maxLength || 200,
          min_length: options?.minLength || 50,
          language: options?.language || 'de',
          style: options?.style || 'concise',
        });

        return response.summary || response.text || '';
      } catch (f13Error: unknown) {
        const errorMessage = f13Error instanceof Error ? f13Error.message : 'Unknown error';
        this.logger.warn(`F13 Summary API call failed: ${errorMessage}`);

        // Fallback zu WattWeiser Summary Provider (wenn verfügbar)
        if (options?.fallback) {
          this.logger.log('Falling back to WattWeiser summary provider');
          return await options.fallback();
        }

        // Letzter Fallback: Einfache Text-Kürzung
        this.logger.warn('No fallback available, using simple text truncation');
        const maxLength = options?.maxLength || 200;
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`F13 summary failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Mehrere Texte zusammenfassen
   */
  async summarizeMultiple(texts: string[], options?: SummaryOptions): Promise<string> {
    try {
      this.logger.debug('F13 summary multiple', { textCount: texts.length });

      // TODO: F13 Summary API für mehrere Texte
      // const response = await this.f13Client.post('/summary/summarize-multiple', {
      //   texts,
      //   ...options,
      // });

      // Placeholder
      const combinedText = texts.join('\n\n');
      return await this.summarize(combinedText, options);
    } catch (error: any) {
      this.logger.error(`F13 summary multiple failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: F13 Summary Health-Check
      return await this.f13Client.healthCheck();
    } catch {
      return false;
    }
  }
}
