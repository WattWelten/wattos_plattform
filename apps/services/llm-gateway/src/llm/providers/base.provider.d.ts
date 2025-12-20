import { AxiosInstance } from 'axios';
import { ChatCompletionRequestDto } from '../dto/chat-completion-request.dto';
import { CompletionRequestDto } from '../dto/completion-request.dto';
import { ChatCompletionResponse, ChatCompletionChunk } from '../interfaces/llm-types';
import { LlmProvider } from '../interfaces/llm-provider.interface';
export declare abstract class BaseProvider implements LlmProvider {
    readonly name: string;
    protected readonly http: AxiosInstance;
    constructor(name: string, baseURL?: string);
    abstract createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse>;
    createCompletion?(request: CompletionRequestDto): Promise<ChatCompletionResponse>;
    streamChatCompletion(request: ChatCompletionRequestDto): AsyncGenerator<ChatCompletionChunk, void, unknown>;
    healthCheck(): Promise<boolean>;
    protected buildResponse(partial: Partial<ChatCompletionResponse>): ChatCompletionResponse;
}
//# sourceMappingURL=base.provider.d.ts.map