import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { CompletionRequestDto } from '../dto/completion-request.dto';
import { ChatCompletionResponse, ChatCompletionChunk } from '../interfaces/llm-types';
import { LlmProvider } from '../interfaces/llm-provider.interface';

export abstract class BaseProvider implements LlmProvider {
  protected readonly http: AxiosInstance;

  constructor(public readonly name: string, baseURL?: string) {
    const httpConfig: { baseURL?: string; timeout: number } = {
      timeout: 1000 * 60,
    };
    if (baseURL !== undefined) {
      httpConfig.baseURL = baseURL;
    }
    this.http = axios.create(httpConfig);
  }

  abstract createChatCompletion(
    request: ChatCompletionRequestDto,
  ): Promise<ChatCompletionResponse>;

  createCompletion?(request: CompletionRequestDto): Promise<ChatCompletionResponse>;

  async *streamChatCompletion(
    request: ChatCompletionRequestDto,
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const response = await this.createChatCompletion(request);
    yield {
      id: response.id,
      object: 'chat.completion.chunk',
      created: response.created,
      model: response.model,
      choices: response.choices.map((choice) => ({
        index: choice.index,
        delta: { content: choice.message.content, role: choice.message.role },
        finish_reason: choice.finish_reason,
      })),
    };
    yield {
      id: response.id,
      object: 'chat.completion.chunk',
      created: response.created,
      model: response.model,
      choices: response.choices.map((choice) => ({
        index: choice.index,
        delta: {},
        finish_reason: choice.finish_reason ?? 'stop',
      })),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.http.get('/');
      return true;
    } catch {
      return false;
    }
  }

  protected buildResponse(partial: Partial<ChatCompletionResponse>): ChatCompletionResponse {
    return {
      id: partial.id ?? uuid(),
      object: partial.object ?? 'chat.completion',
      created: partial.created ?? Math.floor(Date.now() / 1000),
      model: partial.model ?? 'unknown',
      choices: partial.choices ?? [],
      usage:
        partial.usage ?? {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      provider: this.name,
    };
  }
}
