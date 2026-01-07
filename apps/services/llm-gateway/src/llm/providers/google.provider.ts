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
    const payload: any = {
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

    // Tools hinzufügen, falls vorhanden (Google Gemini Format)
    if (request.tools && request.tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: request.tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
          })),
        },
      ];
    }

    const { data } = await this.http.post(url, payload);
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map((part: any) => part.text ?? '').join('\n') ?? '';

    // Tool calls aus Google Response extrahieren
    const toolCalls: any[] = [];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.functionCall) {
          toolCalls.push({
            id: `${Date.now()}-${Math.random()}`,
            type: 'function',
            function: {
              name: part.functionCall.name ?? '',
              arguments: JSON.stringify(part.functionCall.args ?? {}),
            },
          });
        }
      }
    }

    return this.buildResponse({
      id: candidate?.id ?? `${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: text,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          },
          finish_reason: candidate?.finishReason ?? null,
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
