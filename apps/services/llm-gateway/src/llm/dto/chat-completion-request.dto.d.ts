import { ChatMessageDto } from './chat-message.dto';
export declare class ChatCompletionRequestDto {
    model: string;
    messages: ChatMessageDto[];
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stream?: boolean;
    provider?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=chat-completion-request.dto.d.ts.map