import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';

interface GoogleConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class GoogleProvider extends BaseProvider {
  constructor(private readonly config: GoogleConfig) {
    super('google', config.baseUrl);
  }

  private buildUrl(_model: string) {
    if (!this.config.apiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }
    return `${this.config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'}/models/:generateContent?key=${this.config.apiKey}`;
  }

  async createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse> {
    const url = this.buildUrl(request.model);
    const payload = {
      contents: request.messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        temperature: request.temperature,
        topP: request.top_p,
        maxOutputTokens: request.max_tokens,
      },
    };

    const { data } = await this.http.post(url, payload);
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text ?? '').join('\n') ?? '';

    return this.buildResponse({
      id: data?.candidates?.[0]?.id ?? `${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: text,
          },
          finish_reason: data?.candidates?.[0]?.finishReason ?? null,
        },
      ],
      usage: {
        prompt_tokens: data?.usageMetadata?.promptTokenCount ?? 0,
        completion_tokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens:
          (data?.usageMetadata?.promptTokenCount ?? 0) +
          (data?.usageMetadata?.candidatesTokenCount ?? 0),
      },
    });
  }
}
