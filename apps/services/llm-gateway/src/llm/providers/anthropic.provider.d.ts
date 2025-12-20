import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';
interface AnthropicConfig {
    apiKey?: string;
    baseUrl?: string;
}
export declare class AnthropicProvider extends BaseProvider {
    private readonly config;
    constructor(config: AnthropicConfig);
    private get headers();
    createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse>;
}
export {};
//# sourceMappingURL=anthropic.provider.d.ts.map