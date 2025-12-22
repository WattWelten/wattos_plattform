import { SummaryService } from './summary.service';
import { CreateSummaryDto } from './dto/create-summary.dto';
export declare class SummaryController {
    private readonly summaryService;
    constructor(summaryService: SummaryService);
    createSummary(dto: CreateSummaryDto): Promise<{
        summary: any;
        originalLength: number;
        summaryLength: any;
        compressionRatio: number;
        model: string;
        provider: string;
    }>;
    summarizeChat(chatId: string): Promise<{
        summary: any;
        originalLength: number;
        summaryLength: any;
        compressionRatio: number;
        model: string;
        provider: string;
    }>;
    summarizeDocument(documentId: string): Promise<{
        summary: any;
        originalLength: number;
        summaryLength: any;
        compressionRatio: number;
        model: string;
        provider: string;
    }>;
}
//# sourceMappingURL=summary.controller.d.ts.map