import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AvatarRepoClient } from './avatar-repo.client';
import { GLBProcessorService } from './glb-processor.service';
import { AvaturnAdapterService } from './avaturn-adapter.service';
import { AvatarConfig, defaultAvatarConfig } from './config';

/**
 * Avatar Service (Haupt-Service)
 * 
 * Orchestriert Avatar-Erstellung, -Optimierung und -Verwaltung
 */
@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly config: AvatarConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly avatarRepo: AvatarRepoClient,
    private readonly glbProcessor: GLBProcessorService,
    private readonly avaturnAdapter: AvaturnAdapterService,
    config?: Partial<AvatarConfig>,
  ) {
    this.config = { ...defaultAvatarConfig, ...config };
  }

  /**
   * Avatar aus Kunden-Bild erstellen (vollständiger Workflow)
   */
  async createAvatarFromCustomerImage(
    imageBuffer: Buffer,
    tenantId: string,
    characterId: string,
    options?: {
      quality?: 'standard' | 'premium';
      enableMorphs?: boolean;
      enableRigs?: boolean;
    },
  ): Promise<{
    avatarId: string;
    glbUrl: string;
    thumbnailUrl: string;
    qualityScore: number;
    optimizations: string[];
  }> {
    try {
      this.logger.log(`Creating avatar from customer image`, {
        tenantId,
        characterId,
        imageSize: imageBuffer.length,
      });

      // 1. Avatar via avaturn.me erstellen
      const avatarResult = await this.avaturnAdapter.createAvatarFromImage(imageBuffer, {
        quality: options?.quality || 'premium',
        enableMorphs: options?.enableMorphs !== false,
        enableRigs: options?.enableRigs !== false,
      });

      // 2. Qualitäts-Check
      const qualityCheck = await this.avaturnAdapter.checkAvatarQuality(avatarResult.glbUrl);

      // 3. Zu Avatar-Repo hochladen (optional)
      let finalGlbUrl = avatarResult.glbUrl;
      if (this.config.avatarRepoUrl) {
        try {
          const glbResponse = await this.httpService.axiosRef.get(avatarResult.glbUrl, {
            responseType: 'arraybuffer',
          });
          const glbBuffer = Buffer.from(glbResponse.data);

          const uploadResult = await this.avatarRepo.uploadAvatarModel(glbBuffer, {
            tenantId,
            characterId,
            source: 'avaturn',
            quality: avatarResult.quality,
          });

          finalGlbUrl = uploadResult.glbUrl;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Failed to upload to avatar repo: ${errorMessage}`);
          // Fallback: avaturn URL verwenden
        }
      }

      this.logger.log(`Avatar created successfully`, {
        avatarId: avatarResult.avatarId,
        qualityScore: qualityCheck.score,
      });

      return {
        avatarId: avatarResult.avatarId,
        glbUrl: finalGlbUrl,
        thumbnailUrl: avatarResult.thumbnailUrl,
        qualityScore: qualityCheck.score,
        optimizations: Object.values(avatarResult.quality).filter((v) => v === true),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Avatar creation failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Avatar abrufen
   */
  async getAvatar(avatarId: string): Promise<{
    id: string;
    glbUrl: string;
    thumbnailUrl: string;
    metadata: Record<string, unknown>;
  }> {
    return this.avatarRepo.getAvatarModel(avatarId);
  }

  /**
   * Avatar löschen
   */
  async deleteAvatar(avatarId: string): Promise<void> {
    await this.avatarRepo.deleteAvatarModel(avatarId);
  }
}

