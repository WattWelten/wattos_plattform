import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';
interface OllamaConfig {
    baseUrl?: string;
    model?: string;
}
export declare class OllamaProvider extends BaseProvider {
    private readonly config;
    constructor(config: OllamaConfig);
    createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse>;
}
export {};
//# sourceMappingURL=ollama.provider.d.ts.map