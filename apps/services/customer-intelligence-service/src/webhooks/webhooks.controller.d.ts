import { ContentEnrichmentService } from '../content-enrichment/content-enrichment.service';
import { PrismaService } from '@wattweiser/db';
export declare class WebhooksController {
    private readonly contentEnrichmentService;
    private readonly prisma;
    private readonly logger;
    constructor(contentEnrichmentService: ContentEnrichmentService, prisma: PrismaService);
    handleCrawlerData(data: any): Promise<{
        received: boolean;
        error: string;
        processed?: never;
        analysesUpdated?: never;
    } | {
        received: boolean;
        processed: boolean;
        analysesUpdated: number;
        error?: never;
    } | {
        received: boolean;
        processed: boolean;
        error: any;
        analysesUpdated?: never;
    }>;
    handleDocumentProcessed(data: any): Promise<{
        received: boolean;
        error: string;
        processed?: never;
        message?: never;
        analysesUpdated?: never;
        documentId?: never;
    } | {
        received: boolean;
        processed: boolean;
        message: string;
        error?: never;
        analysesUpdated?: never;
        documentId?: never;
    } | {
        received: boolean;
        processed: boolean;
        analysesUpdated: number;
        documentId: any;
        error?: never;
        message?: never;
    } | {
        received: boolean;
        processed: boolean;
        error: any;
        message?: never;
        analysesUpdated?: never;
        documentId?: never;
    }>;
}
//# sourceMappingURL=webhooks.controller.d.ts.map