import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';

interface AzureConfig {
  apiKey?: string;
  endpoint?: string;
  deployment?: string;
  apiVersion?: string;
}

export class AzureOpenAiProvider extends BaseProvider {
  constructor(private readonly config: AzureConfig) {
    super('azure');
  }

  private buildUrl(path: string) {
    if (!this.config.endpoint || !this.config.deployment) {
      throw new Error('Azure OpenAI configuration missing endpoint or deployment');
    }
    const version = this.config.apiVersion ?? '2023-12-01-preview';
    return `${this.config.endpoint}/openai/deployments/?api-version=${this.config.apiVersion || '2024-02-15-preview'}`;
  }

  private get headers() {
    if (!this.config.apiKey) {
      throw new Error('AZURE_OPENAI_API_KEY is not configured');
    }
    return {
      'api-key': this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse> {
    const url = this.buildUrl('/chat/completions');
    const payload = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      top_p: request.top_p,
      max_tokens: request.max_tokens,
    };
    const { data } = await this.http.post(url, payload, { headers: this.headers });

    return this.buildResponse({
      id: data.id ?? data.created?.toString(),
      created: data.created ?? Math.floor(Date.now() / 1000),
      model: data.model ?? request.model,
      choices: data.choices?.map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message?.role ?? 'assistant',
          content: choice.message?.content ?? '',
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
