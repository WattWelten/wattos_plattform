import { Injectable, Logger } from '@nestjs/common';
import { F13LLMProvider } from '@wattweiser/f13';

/**
 * F13 Chat Service
 * 
 * Chat-Integration mit F13 LLM
 */
@Injectable()
export class F13ChatService {
  private readonly logger = new Logger(F13ChatService.name);

  constructor(private readonly f13LLMProvider: F13LLMProvider) {}

  /**
   * Chat Completion mit F13 LLM
   */
  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<{
    content: string;
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      this.logger.debug(`F13 chat completion`, {
        messageCount: messages.length,
        model: options?.model,
      });

      return await this.f13LLMProvider.chatCompletion(messages, options);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`F13 chat completion failed: ${errorMessage}`, errorStack);
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
      this.logger.debug(`F13 streaming chat completion`, {
        messageCount: messages.length,
      });

      yield* this.f13LLMProvider.streamChatCompletion(messages, options);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`F13 streaming failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    return await this.f13LLMProvider.healthCheck();
  }
}

