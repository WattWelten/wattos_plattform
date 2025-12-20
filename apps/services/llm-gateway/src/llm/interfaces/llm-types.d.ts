export interface ChatCompletionChoice {
    index: number;
    message: {
        role: string;
        content: string;
    };
    finish_reason: string | null;
}
export interface UsageMetrics {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd?: number;
}
export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: ChatCompletionChoice[];
    usage: UsageMetrics;
    provider: string;
}
export interface ChatCompletionChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            content?: string;
            role?: string;
        };
        finish_reason: string | null;
    }>;
}
//# sourceMappingURL=llm-types.d.ts.map