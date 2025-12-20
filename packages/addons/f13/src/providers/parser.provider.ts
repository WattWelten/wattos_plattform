import { Injectable, Logger } from '@nestjs/common';
import { F13Client } from '../client';

/**
 * Parsed Document
 */
export interface ParsedDocument {
  text: string;
  metadata: Record<string, any>;
  chunks?: Array<{ text: string; metadata: Record<string, any> }>;
}

/**
 * F13 Parser Provider
 * 
 * Adapter für F13 Document Parser API
 */
@Injectable()
export class F13ParserProvider {
  private readonly logger = new Logger(F13ParserProvider.name);

  constructor(private readonly f13Client: F13Client) {}

  /**
   * Dokument parsen mit Fallback-Logik
   */
  async parseDocument(
    documentUrl: string,
    options?: {
      chunkSize?: number;
      chunkOverlap?: number;
      extractMetadata?: boolean;
      fallback?: () => Promise<ParsedDocument>;
    },
  ): Promise<ParsedDocument> {
    try {
      this.logger.debug('F13 parser parse document', { documentUrl });

      try {
        // F13 Parser API Call
        const response = await this.f13Client.post('/parser/parse', {
          document_url: documentUrl,
          chunk_size: options?.chunkSize || 1000,
          chunk_overlap: options?.chunkOverlap || 200,
          extract_metadata: options?.extractMetadata !== false,
        });

        return {
          text: response.text || response.content || '',
          metadata: response.metadata || {
            source: documentUrl,
            provider: 'f13',
            parsedAt: new Date().toISOString(),
          },
          chunks: response.chunks || [],
        };
      } catch (f13Error: unknown) {
        const errorMessage = f13Error instanceof Error ? f13Error.message : 'Unknown error';
        this.logger.warn(`F13 Parser API call failed: ${errorMessage}`);

        // Fallback zu WattWeiser Parser (wenn verfügbar)
        if (options?.fallback) {
          this.logger.log('Falling back to WattWeiser parser');
          return await options.fallback();
        }

        // Letzter Fallback: Basis-Parsing
        this.logger.warn('No fallback available, using basic parsing');
        return {
          text: `Document from ${documentUrl} (parsing unavailable)`,
          metadata: {
            source: documentUrl,
            provider: 'f13',
            parsedAt: new Date().toISOString(),
            error: 'F13 Parser temporarily unavailable',
          },
          chunks: [],
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`F13 parser failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Dokument aus Buffer parsen
   */
  async parseDocumentBuffer(
    _buffer: Buffer,
    filename: string,
    mimeType: string,
    options?: {
      chunkSize?: number;
      chunkOverlap?: number;
      extractMetadata?: boolean;
    },
  ): Promise<ParsedDocument> {
    try {
      this.logger.debug('F13 parser parse document buffer', { filename, mimeType });

      // TODO: F13 Parser API mit File-Upload
      // const formData = new FormData();
      // formData.append('file', buffer, filename);
      // const response = await this.f13Client.post('/parser/parse-buffer', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });

      // Placeholder
      return this.parseDocument(`buffer://${filename}`, options);
    } catch (error: any) {
      this.logger.error(`F13 parser buffer failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: F13 Parser Health-Check
      return await this.f13Client.healthCheck();
    } catch {
      return false;
    }
  }
}
