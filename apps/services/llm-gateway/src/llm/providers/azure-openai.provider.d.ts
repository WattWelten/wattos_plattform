import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { ChatCompletionResponse } from '../interfaces/llm-types';
import { BaseProvider } from './base.provider';
interface AzureConfig {
    apiKey?: string;
    endpoint?: string;
    deployment?: string;
    apiVersion?: string;
}
export declare class AzureOpenAiProvider extends BaseProvider {
    private readonly config;
    constructor(config: AzureConfig);
    private buildUrl;
    private get headers();
    createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse>;
}
export {};
//# sourceMappingURL=azure-openai.provider.d.ts.map