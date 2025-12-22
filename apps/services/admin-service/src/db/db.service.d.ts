export declare class DbService {
    private readonly logger;
    private prisma;
    constructor();
    createDocument(dto: {
        id: string;
        knowledgeSpaceId: string;
        fileName: string;
        filePath: string;
        fileType?: string;
        fileSize: number;
    }): Promise<{
        id: string;
        success: boolean;
    }>;
    createChunks(chunks: Array<{
        id: string;
        documentId: string;
        content: string;
        chunkIndex: number;
        metadata: any;
        embedding: number[];
    }>): Promise<{
        count: number;
        chunkIds: any[];
    }>;
    getDocument(id: string): Promise<{
        id: string;
        fileName: string;
        fileType: string;
        chunksCount: number;
    }>;
}
//# sourceMappingURL=db.service.d.ts.map