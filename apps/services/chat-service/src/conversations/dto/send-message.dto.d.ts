declare class SearchToolConfigDto {
    strategy?: string;
    top_k?: number;
}
export declare class SendConversationMessageDto {
    thread_id: string;
    message: string;
    search_tool_config?: SearchToolConfigDto;
}
export {};
//# sourceMappingURL=send-message.dto.d.ts.map