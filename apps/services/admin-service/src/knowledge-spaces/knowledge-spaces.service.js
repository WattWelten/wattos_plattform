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
var KnowledgeSpacesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeSpacesService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("@wattweiser/db");
let KnowledgeSpacesService = KnowledgeSpacesService_1 = class KnowledgeSpacesService {
    logger = new common_1.Logger(KnowledgeSpacesService_1.name);
    prisma;
    constructor() {
        this.prisma = new db_1.PrismaClient();
    }
    async createKnowledgeSpace(dto, tenantId) {
        try {
            const knowledgeSpace = await this.prisma.knowledgeSpace.create({
                data: {
                    tenantId,
                    name: dto.name,
                    description: dto.description,
                    settings: dto.settings || {},
                },
            });
            this.logger.log(`Knowledge space created: ${knowledgeSpace.id}`);
            return {
                id: knowledgeSpace.id,
                tenantId: knowledgeSpace.tenantId,
                name: knowledgeSpace.name,
                description: knowledgeSpace.description,
                settings: knowledgeSpace.settings,
                createdAt: knowledgeSpace.createdAt,
                updatedAt: knowledgeSpace.updatedAt,
            };
        }
        catch (error) {
            this.logger.error(`Knowledge space creation failed: ${error.message}`);
            throw error;
        }
    }
    async listKnowledgeSpaces(tenantId) {
        const knowledgeSpaces = await this.prisma.knowledgeSpace.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
        return knowledgeSpaces.map((ks) => ({
            id: ks.id,
            tenantId: ks.tenantId,
            name: ks.name,
            description: ks.description,
            settings: ks.settings,
            createdAt: ks.createdAt,
            updatedAt: ks.updatedAt,
        }));
    }
    async getKnowledgeSpace(id) {
        const knowledgeSpace = await this.prisma.knowledgeSpace.findUnique({
            where: { id },
            include: {
                documents: true,
            },
        });
        if (!knowledgeSpace) {
            throw new common_1.NotFoundException(`Knowledge space ${id} not found`);
        }
        return {
            id: knowledgeSpace.id,
            tenantId: knowledgeSpace.tenantId,
            name: knowledgeSpace.name,
            description: knowledgeSpace.description,
            settings: knowledgeSpace.settings,
            documentsCount: knowledgeSpace.documents.length,
            createdAt: knowledgeSpace.createdAt,
            updatedAt: knowledgeSpace.updatedAt,
        };
    }
};
exports.KnowledgeSpacesService = KnowledgeSpacesService;
exports.KnowledgeSpacesService = KnowledgeSpacesService = KnowledgeSpacesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], KnowledgeSpacesService);
//# sourceMappingURL=knowledge-spaces.service.js.map