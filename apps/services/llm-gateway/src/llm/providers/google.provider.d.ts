import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';
interface GoogleConfig {
    apiKey?: string;
    baseUrl?: string;
}
export declare class GoogleProvider extends BaseProvider {
    private readonly config;
    constructor(config: GoogleConfig);
    private buildUrl;
    createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse>;
}
export {};
//# sourceMappingURL=google.provider.d.ts.map