import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CreateKnowledgeSpaceDto } from './dto/create-knowledge-space.dto';

@Injectable()
export class KnowledgeSpacesService {
  private readonly logger = new Logger(KnowledgeSpacesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async createKnowledgeSpace(dto: CreateKnowledgeSpaceDto, tenantId: string) {
    try {

      const knowledgeSpace = await this.prismaService.client.knowledgeSpace.create({
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
    } catch (error: any) {
      this.logger.error(`Knowledge space creation failed: ${error.message}`);
      throw error;
    }
  }

  async listKnowledgeSpaces(tenantId: string) {

    const knowledgeSpaces = await this.prismaService.client.knowledgeSpace.findMany({
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

  async getKnowledgeSpace(id: string) {
    const knowledgeSpace = await this.prismaService.client.knowledgeSpace.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!knowledgeSpace) {
      throw new NotFoundException(`Knowledge space ${id} not found`);
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
}




