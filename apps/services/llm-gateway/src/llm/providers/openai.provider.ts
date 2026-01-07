import { AxiosRequestConfig } from 'axios';
import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { CompletionRequestDto } from '../dto/completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';

interface OpenAiConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class OpenAiProvider extends BaseProvider {
  constructor(private readonly config: OpenAiConfig) {
    super('openai', config.baseUrl ?? 'https://api.openai.com/v1');
  }

  private get headers() {
    if (!this.config.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    } satisfies AxiosRequestConfig['headers'];
  }

  async createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse> {
    const payload: any = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      top_p: request.top_p,
      max_tokens: request.max_tokens,
      stream: false,
    };

    // Tools hinzufügen, falls vorhanden
    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools;
    }

    const { data } = await this.http.post('/chat/completions', payload, {
      headers: this.headers,
    });

    return this.buildResponse({
      id: data.id,
      created: data.created,
      model: data.model,
      choices: data.choices?.map((choice: any) => ({
        index: choice.index,
        message: {
          role: choice.message?.role ?? 'assistant',
          content: choice.message?.content ?? '',
          tool_calls: choice.message?.tool_calls?.map((toolCall: any) => ({
            id: toolCall.id,
            type: toolCall.type ?? 'function',
            function: {
              name: toolCall.function?.name ?? '',
              arguments: toolCall.function?.arguments ?? '',
            },
          })),
        },
        finish_reason: choice.finish_reason ?? null,
      })),
      usage: data.usage ?? {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    });
  }

  async createCompletion(request: CompletionRequestDto): Promise<ChatCompletionResponse> {
    const payload = {
      model: request.model,
      prompt: request.prompt,
      temperature: request.temperature,
      top_p: request.top_p,
      max_tokens: request.max_tokens,
    };

    const { data } = await this.http.post('/completions', payload, {
      headers: this.headers,
    });

    return this.buildResponse({
      id: data.id,
      created: data.created,
      model: data.model,
      choices: data.choices?.map((choice: any) => ({
        index: choice.index,
        message: {
          role: 'assistant',
          content: choice.text ?? '',
        },
        finish_reason: choice.finish_reason ?? null,
      })),
      usage: data.usage ?? {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    });
  }
}
