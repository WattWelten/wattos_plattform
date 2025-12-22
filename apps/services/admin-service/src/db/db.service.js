"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
let DbService = DbService_1 = class DbService {
    logger = new common_1.Logger(DbService_1.name);
    prisma;
    constructor() {
        this.prisma = new db_1.PrismaClient();
    }
    async createDocument(dto) {
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
        }
        catch (error) {
            this.logger.error(`Failed to create document: ${error.message}`);
            throw error;
        }
    }
    async createChunks(chunks) {
        try {
            const createdChunks = [];
            for (const chunk of chunks) {
                const created = await this.prisma.chunk.upsert({
                    where: { id: chunk.id },
                    update: {
                        content: chunk.content,
                        chunkIndex: chunk.chunkIndex,
                        metadata: chunk.metadata,
                        embedding: `[${chunk.embedding.join(',')}]`,
                    },
                    create: {
                        id: chunk.id,
                        documentId: chunk.documentId,
                        content: chunk.content,
                        chunkIndex: chunk.chunkIndex,
                        metadata: chunk.metadata,
                        embedding: `[${chunk.embedding.join(',')}]`,
                    },
                });
                createdChunks.push(created.id);
            }
            this.logger.log(`Created ${createdChunks.length} chunks`);
            return { count: createdChunks.length, chunkIds: createdChunks };
        }
        catch (error) {
            this.logger.error(`Failed to create chunks: ${error.message}`);
            throw error;
        }
    }
    async getDocument(id) {
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
};
exports.DbService = DbService;
exports.DbService = DbService = DbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DbService);
//# sourceMappingURL=db.service.js.map