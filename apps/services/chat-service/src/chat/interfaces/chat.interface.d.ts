export interface ChatRequest {
    chatId: string;
    message: string;
    model?: string;
    provider?: string;
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
    knowledgeSpaceId?: string;
    metadata?: Record<string, any>;
}
export interface ChatResponse {
    messageId: string;
    content: string;
    citations?: any[];
    metadata?: Record<string, any>;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: any[];
    metadata?: Record<string, any>;
    createdAt: Date;
}
//# sourceMappingURL=chat.interface.d.ts.map