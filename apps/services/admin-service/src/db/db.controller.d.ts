import { DbService } from './db.service';
export declare class DbController {
    private readonly dbService;
    constructor(dbService: DbService);
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
    createChunks(dto: {
        chunks: Array<{
            id: string;
            documentId: string;
            content: string;
            chunkIndex: number;
            metadata: any;
            embedding: number[];
        }>;
    }): Promise<{
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
//# sourceMappingURL=db.controller.d.ts.map