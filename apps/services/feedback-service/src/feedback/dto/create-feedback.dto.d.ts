export declare enum FeedbackType {
    CHAT = "chat",
    AGENT = "agent",
    FEATURE = "feature",
    GENERAL = "general",
    RATING = "rating",
    COMMENT = "comment",
    IMPROVEMENT = "improvement"
}
export declare class CreateFeedbackDto {
    type: FeedbackType;
    resourceId: string;
    rating: number;
    comment?: string;
    userId: string;
    tenantId?: string;
}
//# sourceMappingURL=create-feedback.dto.d.ts.map