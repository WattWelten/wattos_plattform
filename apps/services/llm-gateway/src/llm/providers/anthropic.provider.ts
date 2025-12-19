import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';

interface AnthropicConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class AnthropicProvider extends BaseProvider {
  constructor(private readonly config: AnthropicConfig) {
    super('anthropic', config.baseUrl ?? 'https://api.anthropic.com');
  }

  private get headers() {
    if (!this.config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    return {
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
  }

  async createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse> {
    const payload = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      top_p: request.top_p,
      max_tokens: request.max_tokens ?? 1024,
    };

    const { data } = await this.http.post('/v1/messages', payload, { headers: this.headers });

    const content = Array.isArray(data.content)
      ? data.content.map((item) => item.text ?? '').join('\n')
      : data.content ?? '';

    return this.buildResponse({
      id: data.id,
      created: Math.floor(Date.now() / 1000),
      model: data.model ?? request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: data.stop_reason ?? null,
        },
      ],
      usage: {
        prompt_tokens: data.usage?.input_tokens ?? 0,
        completion_tokens: data.usage?.output_tokens ?? 0,
        total_tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    });
  }
}
