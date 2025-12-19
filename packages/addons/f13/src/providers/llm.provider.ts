import { Injectable, Logger } from '@nestjs/common';
import { F13Client, F13ApiError } from '../client';
import { RAGProvider, RAGContext, RAGResponse, RAGResult } from '@wattweiser/core';

/**
 * F13 LLM Provider
 * 
 * Adapter für F13 LLM/Chat API
 */
@Injectable()
export class F13LLMProvider {
  private readonly logger = new Logger(F13LLMProvider.name);

  constructor(private readonly f13Client: F13Client) {}

  /**
   * Chat Completion mit Fallback-Logik
   */
  async chatCompletion(messages: Array<{ role: string; content: string }>, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    fallback?: () => Promise<{
      content: string;
      model: string;
      usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    }>;
  }): Promise<{
    content: string;
    model: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    try {
      this.logger.debug('F13 LLM chat completion', { messageCount: messages.length });

      try {
        // F13 Chat API Call
        const response = await this.f13Client.post('/chat/completions', {
          messages,
          model: options?.model || 'default',
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000,
        });

        return {
          content: response.content || response.choices?.[0]?.message?.content || '',
          model: response.model || options?.model || 'f13-default',
          usage: response.usage || {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        };
      } catch (f13Error: unknown) {
        const errorMessage = f13Error instanceof Error ? f13Error.message : 'Unknown error';
        this.logger.warn(`F13 LLM API call failed: ${errorMessage}`);

        // Fallback zu WattWeiser Provider (wenn verfügbar)
        if (options?.fallback) {
          this.logger.info('Falling back to WattWeiser LLM provider');
          return await options.fallback();
        }

        // Letzter Fallback: Placeholder
        this.logger.warn('No fallback available, using placeholder response');
        return {
          content: 'F13 LLM temporarily unavailable. Please try again later.',
          model: options?.model || 'f13-default',
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`F13 LLM chat completion failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Streaming Chat Completion
   */
  async *streamChatCompletion(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): AsyncGenerator<string, void, unknown> {
    try {
      this.logger.debug('F13 LLM streaming chat completion', { messageCount: messages.length });

      // TODO: F13 Streaming API
      // const stream = await this.f13Client.post('/chat/completions/stream', { ... });

      // Placeholder
      const response = await this.chatCompletion(messages, options);
      const words = response.content.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error: any) {
      this.logger.error(`F13 LLM streaming failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: F13 LLM Health-Check
      return await this.f13Client.healthCheck();
    } catch {
      return false;
    }
  }
}

