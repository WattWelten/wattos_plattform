import { Response } from 'express';
import { ChatCompletionRequestDto } from './dto/chat-completion-request.dto';
import { CompletionRequestDto } from './dto/completion-request.dto';
import { LlmService } from './llm.service';
export declare class LlmController {
    private readonly llmService;
    constructor(llmService: LlmService);
    createChatCompletion(body: ChatCompletionRequestDto, res: Response): Promise<void | import("./interfaces/llm-types").ChatCompletionResponse>;
    createCompletion(body: CompletionRequestDto): Promise<import("./interfaces/llm-types").ChatCompletionResponse>;
    listProviders(): Promise<{
        name: string;
        healthy: boolean;
    }[]>;
    private handleStream;
}
//# sourceMappingURL=llm.controller.d.ts.map