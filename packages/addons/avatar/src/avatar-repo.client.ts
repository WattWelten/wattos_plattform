import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AvatarConfig, defaultAvatarConfig } from './config';

/**
 * Avatar Repo Client
 * 
 * Client für Avatar-Repo API zur Verwaltung von Avatar-Modellen
 */
@Injectable()
export class AvatarRepoClient {
  private readonly logger = new Logger(AvatarRepoClient.name);
  private readonly config: AvatarConfig;

  private readonly httpClient: AxiosInstance;

  constructor(config?: Partial<AvatarConfig>) {
    this.config = { ...defaultAvatarConfig, ...config };
    this.httpClient = axios.create({
      baseURL: this.config.avatarRepoUrl || '',
      timeout: 30000,
    });
  }

  /**
   * Avatar-Modell abrufen
   */
  async getAvatarModel(avatarId: string): Promise<{
    id: string;
    glbUrl: string;
    thumbnailUrl: string;
    metadata: Record<string, unknown>;
  }> {
    try {
      const response = await this.httpClient.get(`/api/v1/avatars/${avatarId}`);

      return {
        id: response.data.id,
        glbUrl: response.data.glbUrl,
        thumbnailUrl: response.data.thumbnailUrl,
        metadata: response.data.metadata || {},
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get avatar model: ${errorMessage}`, { avatarId });
      throw error;
    }
  }

  /**
   * Avatar-Modell hochladen
   */
  async uploadAvatarModel(
    glbBuffer: Buffer,
    metadata: Record<string, unknown>,
  ): Promise<{
    id: string;
    glbUrl: string;
  }> {
    try {
      // Node.js: FormData aus 'form-data' Package verwenden
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', glbBuffer, {
        filename: 'avatar.glb',
        contentType: 'model/gltf-binary',
      });
      formData.append('metadata', JSON.stringify(metadata));

      const response = await this.httpClient.post('/api/v1/avatars/upload', formData, {
        headers: {
          ...formData.getHeaders(), // Wichtig: Headers von FormData verwenden
        },
      });

      return {
        id: response.data.id,
        glbUrl: response.data.glbUrl,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload avatar model: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Avatar-Modell löschen
   */
  async deleteAvatarModel(avatarId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/api/v1/avatars/${avatarId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete avatar model: ${errorMessage}`, { avatarId });
      throw error;
    }
  }
}
