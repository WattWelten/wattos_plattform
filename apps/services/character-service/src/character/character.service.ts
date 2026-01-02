import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CreateCharacterDto } from './dto/create-character.dto';

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Character erstellen
   */
  async createCharacter(dto: CreateCharacterDto, tenantId?: string) {
    try {
      // Prüfen ob Character mit dieser role bereits existiert (pro Tenant)
      const where: any = { role: dto.role };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const existing = await this.prisma.character.findFirst({
        where,
      });

      if (existing) {
        // Wenn existiert, zurückgeben statt Fehler (idempotent)
        this.logger.log(`Character mit role "${dto.role}" existiert bereits`);
        return this.mapToResponse(existing);
      }

      // Neuen Character erstellen
      const character = await this.prisma.character.create({
        data: {
          tenantId: tenantId || 'default', // MVP: Fallback zu 'default'
          role: dto.role,
          agent: dto.agent || 'chatbot',
          voiceId: dto.voice_id,
          voiceModel: dto.voice_model,
          systemPrompt: dto.system_prompt,
          customParameters: dto.custom_parameters || {},
          knowledgeBase: dto.knowledge_base || {},
        },
      });

      this.logger.log(`Character erstellt: ${character.role}`);
      return this.mapToResponse(character);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Character creation failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Alle Characters auflisten (optional: pro Tenant)
   */
  async listCharacters(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    const characters = await this.prisma.character.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return characters.map((c) => this.mapToResponse(c));
  }

  /**
   * Character nach role abrufen (optional: pro Tenant)
   */
  async getCharacterByRole(role: string, tenantId?: string) {
    const where: any = { role };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const character = await this.prisma.character.findFirst({
      where,
      include: {
        artifacts: true,
      },
    });

    if (!character) {
      throw new NotFoundException(`Character mit role "${role}" nicht gefunden`);
    }

    return this.mapToResponse(character);
  }

  /**
   * Character nach ID abrufen
   */
  async getCharacterById(id: string) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        artifacts: true,
      },
    });

    if (!character) {
      throw new NotFoundException(`Character mit ID "${id}" nicht gefunden`);
    }

    return this.mapToResponse(character);
  }

  /**
   * Character aktualisieren
   */
  async updateCharacter(id: string, dto: Partial<CreateCharacterDto>) {
    const character = await this.prisma.character.update({
      where: { id },
      data: {
        ...(dto.system_prompt && { systemPrompt: dto.system_prompt }),
        ...(dto.voice_id && { voiceId: dto.voice_id }),
        ...(dto.voice_model && { voiceModel: dto.voice_model }),
        ...(dto.custom_parameters && { customParameters: dto.custom_parameters }),
        ...(dto.knowledge_base && { knowledgeBase: dto.knowledge_base }),
      },
    });

    return this.mapToResponse(character);
  }

  /**
   * Character löschen
   */
  async deleteCharacter(id: string) {
    await this.prisma.character.delete({
      where: { id },
    });

    return { message: 'Character gelöscht' };
  }

  /**
   * Character zu API-Response formatieren
   */
  private mapToResponse(character: any) {
    return {
      id: character.id,
      tenantId: character.tenantId,
      role: character.role,
      name: character.name,
      personality: character.personality || {},
      agent: character.agent,
      voice_id: character.voiceId,
      voice_model: character.voiceModel,
      system_prompt: character.systemPrompt,
      prompt: character.prompt,
      custom_parameters: character.customParameters || {},
      knowledge_base: character.knowledgeBase || {},
      created_at: character.createdAt,
      updated_at: character.updatedAt,
    };
  }
}
