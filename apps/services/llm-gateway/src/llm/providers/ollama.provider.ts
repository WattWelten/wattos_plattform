import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';

interface OllamaConfig {
  baseUrl?: string;
  model?: string;
}

export class OllamaProvider extends BaseProvider {
  constructor(private readonly config: OllamaConfig) {
    super('ollama', config.baseUrl ?? 'http://localhost:11434');
  }

  async createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse> {
    const payload = {
      model: request.model ?? this.config.model ?? 'llama2',
      messages: request.messages,
      options: {
        temperature: request.temperature,
        top_p: request.top_p,
      },
      stream: false,
    };

    const { data } = await this.http.post('/api/chat', payload);
    const message = data?.message ?? { role: 'assistant', content: data?.response ?? '' };

    return this.buildResponse({
      id: data?.id ?? `${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      model: payload.model,
      choices: [
        {
          index: 0,
          message,
          finish_reason: data?.done ? 'stop' : null,
        },
      ],
      usage: {
        prompt_tokens: data?.prompt_eval_count ?? 0,
        completion_tokens: data?.eval_count ?? 0,
        total_tokens: (data?.prompt_eval_count ?? 0) + (data?.eval_count ?? 0),
      },
    });
  }
}
