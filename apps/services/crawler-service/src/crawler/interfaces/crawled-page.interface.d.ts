export interface CrawledPage {
    url: string;
    title: string;
    content: string;
    html: string;
    metadata: {
        description?: string;
        keywords?: string[];
        language?: string;
        author?: string;
        publishedDate?: string;
        modifiedDate?: string;
    };
    links: string[];
    images: string[];
    depth: number;
    crawledAt: Date;
}
export interface CrawlResult {
    id: string;
    tenantId: string;
    startUrl: string;
    status: 'running' | 'completed' | 'failed';
    pages: CrawledPage[];
    totalPages: number;
    crawledPages: number;
    failedPages: number;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}
//# sourceMappingURL=crawled-page.interface.d.ts.map