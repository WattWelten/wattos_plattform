import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import { AvatarConfig, defaultAvatarConfig } from './config';
import { GLBProcessorService } from './glb-processor.service';

/**
 * Avaturn.me Adapter Service
 * 
 * Integration mit avaturn.me API für automatische Avatar-Erstellung aus Kunden-Bildern
 */
@Injectable()
export class AvaturnAdapterService {
  private readonly logger = new Logger(AvaturnAdapterService.name);
  private readonly config: AvatarConfig;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly glbProcessor: GLBProcessorService,
    config?: Partial<AvatarConfig>,
  ) {
    this.config = { ...defaultAvatarConfig, ...config };
    const headers: Record<string, string> = {};
    if (this.config.avaturnApiKey) {
      headers['Authorization'] = `Bearer ${this.config.avaturnApiKey}`;
    }
    this.httpClient = axios.create({
      baseURL: this.config.avaturnApiUrl || '',
      timeout: 60000,
      headers,
    });
  }

  /**
   * Avatar aus Bild erstellen (avaturn.me)
   */
  async createAvatarFromImage(
    imageBuffer: Buffer,
    options?: {
      quality?: 'standard' | 'premium';
      enableMorphs?: boolean;
      enableRigs?: boolean;
    },
  ): Promise<{
    avatarId: string;
    glbUrl: string;
    thumbnailUrl: string;
    quality: {
      textureResolution: string;
      pbrEnabled: boolean;
      morphsEnabled: boolean;
      rigsEnabled: boolean;
    };
  }> {
    try {
      if (!this.config.avaturnApiKey) {
        throw new Error('Avaturn API key not configured');
      }

      this.logger.debug('Creating avatar from image via avaturn.me', {
        imageSize: imageBuffer.length,
        options,
      });

      // 1. Bild zu avaturn.me hochladen
      // Node.js: FormData aus 'form-data' Package verwenden
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });
      formData.append('quality', options?.quality || 'premium');
      formData.append('enableMorphs', String(options?.enableMorphs !== false));
      formData.append('enableRigs', String(options?.enableRigs !== false));

      const response = await this.httpClient.post('/api/v1/avatars/create', formData, {
        headers: {
          ...formData.getHeaders(), // Wichtig: Headers von FormData verwenden
        },
      });

      const avatarId = response.data.avatarId;
      const glbUrl = response.data.glbUrl;
      const thumbnailUrl = response.data.thumbnailUrl;

      // 2. GLB herunterladen und optimieren (wenn Premium)
      let optimizedGlbUrl = glbUrl;
      if (options?.quality === 'premium') {
        optimizedGlbUrl = await this.optimizeAvatarGLB(glbUrl, avatarId);
      }

      this.logger.log(`Avatar created successfully: ${avatarId}`, {
        glbUrl: optimizedGlbUrl,
      });

      return {
        avatarId,
        glbUrl: optimizedGlbUrl,
        thumbnailUrl,
        quality: {
          textureResolution: this.config.quality?.textureResolution || '2K',
          pbrEnabled: this.config.quality?.enablePBR ?? true,
          morphsEnabled: options?.enableMorphs !== false,
          rigsEnabled: options?.enableRigs !== false,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Avatar creation failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Avatar GLB optimieren (HeyGen-Qualität)
   */
  private async optimizeAvatarGLB(glbUrl: string, avatarId: string): Promise<string> {
    try {
      // GLB herunterladen
      const glbResponse = await axios.get(glbUrl, { responseType: 'arraybuffer' });
      const glbBuffer = Buffer.from(glbResponse.data);

      // Temporäre Dateien
      const tempInputPath = `/tmp/avatar-${avatarId}-input.glb`;
      const tempOutputPath = `/tmp/avatar-${avatarId}-output.glb`;

      // GLB speichern
      await fs.promises.writeFile(tempInputPath, glbBuffer);

      // Optimieren
      const result = await this.glbProcessor.optimizeGLB(
        tempInputPath,
        tempOutputPath,
        {
          textureResolution: this.config.quality?.textureResolution || '2K',
          enablePBR: this.config.quality?.enablePBR ?? true,
          addMorphs: true,
          optimizeLighting: true,
        },
      );

      if (result.success) {
        // Optimiertes GLB hochladen (zurück zu Avatar-Repo)
        // MVP: Placeholder, später: Upload zu Storage
        this.logger.debug(`Avatar GLB optimized: ${avatarId}`, {
          optimizations: result.optimizations,
        });
        return glbUrl; // MVP: Original URL zurückgeben
      }

      return glbUrl;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Avatar GLB optimization failed: ${errorMessage}`, { avatarId });
      return glbUrl; // Fallback: Original URL
    }
  }

  /**
   * Avatar-Qualität prüfen
   */
  async checkAvatarQuality(glbUrl: string): Promise<{
    score: number; // 0-1
    checks: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
  }> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];

    try {
      // GLB herunterladen
      const glbResponse = await axios.get(glbUrl, { responseType: 'arraybuffer' });
      const glbBuffer = Buffer.from(glbResponse.data);

      // Temporäre Datei
      const tempPath = `/tmp/avatar-check-${Date.now()}.glb`;
      await fs.promises.writeFile(tempPath, glbBuffer);

      // Validierung
      const validation = await this.glbProcessor.validateGLB(tempPath);

      // Qualitäts-Checks
      checks.push({
        name: 'GLB Valid',
        passed: validation.valid,
        message: validation.valid ? 'GLB is valid' : validation.errors.join(', '),
      });

      checks.push({
        name: 'Textures Present',
        passed: validation.warnings.length === 0 || !validation.warnings.includes('No textures'),
        message: validation.warnings.includes('No textures') ? 'No textures found' : 'Textures present',
      });

      // Score berechnen
      const passedChecks = checks.filter((c) => c.passed).length;
      const score = checks.length > 0 ? passedChecks / checks.length : 0;

      // Cleanup
      try {
        await fs.promises.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }

      return {
        score,
        checks,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      checks.push({
        name: 'Quality Check',
        passed: false,
        message: `Failed: ${errorMessage}`,
      });

      return {
        score: 0,
        checks,
      };
    }
  }
}
