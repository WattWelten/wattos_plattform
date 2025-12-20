import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { CompletionRequestDto } from '../dto/completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';
interface OpenAiConfig {
    apiKey?: string;
    baseUrl?: string;
}
export declare class OpenAiProvider extends BaseProvider {
    private readonly config;
    constructor(config: OpenAiConfig);
    private get headers();
    createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse>;
    createCompletion(request: CompletionRequestDto): Promise<ChatCompletionResponse>;
}
export {};
//# sourceMappingURL=openai.provider.d.ts.map