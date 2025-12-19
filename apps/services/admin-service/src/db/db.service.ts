import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

@Injectable()
export class DbService {
  private readonly logger = new Logger(DbService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createDocument(dto: { id: string; knowledgeSpaceId: string; fileName: string; filePath: string; fileType?: string; fileSize: number }) {
    try {
      const document = await this.prisma.document.upsert({
        where: { id: dto.id },
        update: {
          fileName: dto.fileName,
          filePath: dto.filePath,
          fileType: dto.fileType,
          fileSize: BigInt(dto.fileSize),
        },
        create: {
          id: dto.id,
          knowledgeSpaceId: dto.knowledgeSpaceId,
          fileName: dto.fileName,
          filePath: dto.filePath,
          fileType: dto.fileType,
          fileSize: BigInt(dto.fileSize),
        },
      });

      this.logger.log(`Document created/updated: ${document.id}`);
      return { id: document.id, success: true };
    } catch (error: any) {
      this.logger.error(`Failed to create document: ${error.message}`);
      throw error;
    }
  }

  async createChunks(chunks: Array<{ id: string; documentId: string; content: string; chunkIndex: number; metadata: any; embedding: number[] }>) {
    try {
      const createdChunks = [];
      
      for (const chunk of chunks) {
        const created = await this.prisma.chunk.upsert({
          where: { id: chunk.id },
          update: {
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata,
            embedding: `[${chunk.embedding.join(',')}]` as any, // pgvector format
          },
          create: {
            id: chunk.id,
            documentId: chunk.documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata,
            embedding: `[${chunk.embedding.join(',')}]` as any,
          },
        });
        createdChunks.push(created.id);
      }

      this.logger.log(`Created ${createdChunks.length} chunks`);
      return { count: createdChunks.length, chunkIds: createdChunks };
    } catch (error: any) {
      this.logger.error(`Failed to create chunks: ${error.message}`);
      throw error;
    }
  }

  async getDocument(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        chunks: true,
      },
    });

    if (!document) {
      throw new Error(`Document ${id} not found`);
    }

    return {
      id: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      chunksCount: document.chunks.length,
    };
  }
}














