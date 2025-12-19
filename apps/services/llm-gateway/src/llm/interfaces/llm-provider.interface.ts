import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { CompletionRequestDto } from '../dto/completion-request.dto';
import { ChatCompletionResponse, ChatCompletionChunk } from './llm-types';

export interface LlmProvider {
  readonly name: string;
  createChatCompletion(
    request: ChatCompletionRequestDto,
    options?: ProviderCallOptions,
  ): Promise<ChatCompletionResponse>;
  createCompletion?(request: CompletionRequestDto, options?: ProviderCallOptions): Promise<ChatCompletionResponse>;
  streamChatCompletion?(
    request: ChatCompletionRequestDto,
    options?: ProviderCallOptions,
  ): AsyncGenerator<ChatCompletionChunk, void, unknown>;
  healthCheck(): Promise<boolean>;
}

export interface ProviderCallOptions {
  tenantId?: string;
  metadata?: Record<string, any>;
}
