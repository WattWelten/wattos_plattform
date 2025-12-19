import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { AddArtifactDto } from './dto/add-artifact.dto';

@Injectable()
export class ArtifactsService {
  private readonly logger = new Logger(ArtifactsService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Artefakt per URL hinzufügen
   */
  async addArtifactByUrl(dto: AddArtifactDto) {
    try {
      // Character nach role finden
      const character = await this.prisma.character.findFirst({
        where: { role: dto.character },
      });

      if (!character) {
        throw new NotFoundException(`Character mit role "${dto.character}" nicht gefunden`);
      }

      // Artefakt erstellen
      const artifact = await this.prisma.artifact.create({
        data: {
          characterId: character.id,
          name: dto.name,
          description: dto.description,
          url: dto.url,
          storageType: dto.storage_type || 'local',
        },
      });

      this.logger.log(`Artifact hinzugefügt: ${artifact.name} → ${artifact.id}`);
      return this.mapToResponse(artifact);
    } catch (error: any) {
      this.logger.error(`Artifact creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Alle Artefakte eines Characters auflisten
   */
  async listArtifacts(characterRole?: string) {
    const where: any = {};
    if (characterRole) {
      const character = await this.prisma.character.findFirst({
        where: { role: characterRole },
      });
      if (character) {
        where.characterId = character.id;
      }
    }

    const artifacts = await this.prisma.artifact.findMany({
      where,
      include: {
        character: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return artifacts.map((a) => this.mapToResponse(a));
  }

  /**
   * Artefakt abrufen
   */
  async getArtifact(id: string) {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id },
      include: {
        character: true,
      },
    });

    if (!artifact) {
      throw new NotFoundException(`Artifact mit ID "${id}" nicht gefunden`);
    }

    return this.mapToResponse(artifact);
  }

  /**
   * Artefakt löschen
   */
  async deleteArtifact(id: string) {
    await this.prisma.artifact.delete({
      where: { id },
    });

    return { message: 'Artifact gelöscht' };
  }

  /**
   * Artefakt zu API-Response formatieren
   */
  private mapToResponse(artifact: any) {
    return {
      id: artifact.id,
      name: artifact.name,
      description: artifact.description,
      url: artifact.url,
      storage_type: artifact.storageType,
      metadata: artifact.metadata || {},
      created_at: artifact.createdAt,
      updated_at: artifact.updatedAt,
    };
  }
}

