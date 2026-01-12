import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { PrismaService } from '@wattweiser/db';
import axios from 'axios';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly avatarConfigs: Map<string, any> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Avatar für Agent generieren (TTS + Rendering)
   */
  async generateAvatar(agentId: string, text: string, voiceId?: string): Promise<{
    avatarUrl: string;
    audioUrl: string;
    videoUrl?: string;
  }> {
    try {
      // 1. TTS über Voice-Service
      const voiceServiceUrl = this.serviceDiscovery.getServiceUrl('voice-service', 3016);
      const ttsResponse = await firstValueFrom(
        this.httpService.post(
          `${voiceServiceUrl}/api/v1/voice/tts`,
          {
            text,
            voice: voiceId || 'alloy',
            language: 'de',
          },
          {
            responseType: 'arraybuffer',
          },
        ),
      );

      const audioBuffer = Buffer.from(ttsResponse.data);
      const audioBase64 = audioBuffer.toString('base64');

      // 2. Avatar-Scene-Konfiguration (Rendering erfolgt im Frontend mit Babylon.js)
      const avatarConfig = await this.getAvatarConfig(agentId);

      return {
        avatarUrl: `/api/v1/avatar/${agentId}/scene`, // URL für Babylon.js Scene-Konfiguration
        audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
        sceneConfig: avatarConfig, // Scene-Konfiguration für Frontend-Rendering
      };
    } catch (error: any) {
      this.logger.error(`Avatar generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Avatar-Konfiguration erstellen/abrufen (für Frontend-Rendering)
   * Rendering erfolgt im Frontend mit Babylon.js für bessere Performance
   */
  private async getAvatarConfig(agentId: string): Promise<any> {
    if (this.avatarConfigs.has(agentId)) {
      return this.avatarConfigs.get(agentId);
    }

    // Standard-Avatar-Konfiguration (kann später aus DB geladen werden)
    const config = {
      agentId,
      model: {
        type: 'gltf', // oder 'box', 'sphere', etc.
        url: null, // URL zu GLTF-Modell (wenn vorhanden)
        fallback: 'box', // Fallback wenn kein Modell vorhanden
      },
      scene: {
        camera: {
          position: { x: 0, y: 2, z: -5 },
          target: { x: 0, y: 0, z: 0 },
          fov: 0.8,
        },
        lights: [
          {
            type: 'hemispheric',
            name: 'light1',
            direction: { x: 0, y: 1, z: 0 },
            intensity: 0.7,
          },
          {
            type: 'directional',
            name: 'light2',
            direction: { x: -1, y: -1, z: -1 },
            intensity: 0.5,
          },
        ],
        background: {
          color: { r: 0.1, g: 0.1, b: 0.15 },
        },
      },
      avatar: {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        material: {
          type: 'standard',
          diffuseColor: { r: 0.5, g: 0.5, b: 0.8 },
          specularColor: { r: 0.2, g: 0.2, b: 0.2 },
        },
        animations: {
          lipSync: {
            enabled: true,
            property: 'position.y',
            range: [0, 0.1],
          },
        },
      },
    };

    this.avatarConfigs.set(agentId, config);
    this.logger.log(`Avatar config created for agent ${agentId}`);
    return config;
  }

  /**
   * Avatar-Streaming (WebSocket/WebRTC)
   * Streaming erfolgt durch Frontend, Service liefert nur Konfiguration
   */
  async streamAvatar(agentId: string): Promise<{
    streamUrl: string;
    websocketUrl: string;
    sceneConfig: any;
  }> {
    try {
      const sceneConfig = await this.getAvatarConfig(agentId);
      const port = this.configService.get('port', 3009);
      const baseUrl = this.configService.get('BASE_URL', `http://localhost:${port}`);

      // WebSocket-URL für Echtzeit-Streaming (Frontend verbindet sich)
      const websocketUrl = `ws://${baseUrl.replace('http://', '').replace('https://', '')}/avatar/stream/${agentId}`;

      return {
        streamUrl: `/api/v1/avatar/${agentId}/stream`,
        websocketUrl,
        sceneConfig,
      };
    } catch (error: any) {
      this.logger.error(`Avatar streaming setup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Avatar-Scene-Konfiguration exportieren (für Frontend Babylon.js)
   */
  async exportAvatarScene(agentId: string): Promise<any> {
    const sceneConfig = await this.getAvatarConfig(agentId);
    return {
      agentId,
      ...sceneConfig,
    };
  }

  /**
   * Avatar-Liste für Tenant abrufen
   */
  async getAvatarsForTenant(tenantId: string): Promise<Array<{
    id: string;
    name: string;
    glbUrl: string;
    thumbnailUrl: string | null;
    characterId: string | null;
    source: string;
    createdAt: Date;
  }>> {
    const avatars = await this.prisma.avatar.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        glbUrl: true,
        thumbnailUrl: true,
        characterId: true,
        source: true,
        createdAt: true,
      },
    });

    return avatars;
  }

  /**
   * Avatar erstellen (aus Bild)
   * 
   * Nutzt Avaturn-Integration wenn konfiguriert, sonst Fallback
   */
  async createAvatar(
    tenantId: string,
    imageBuffer: Buffer,
    name: string,
    characterId?: string,
  ): Promise<{
    id: string;
    name: string;
    glbUrl: string;
    thumbnailUrl: string | null;
  }> {
    try {
      const { randomUUID } = await import('crypto');
      const avatarId = randomUUID();

      // Versuche Avaturn-Integration zu nutzen (wenn API-Key konfiguriert)
      const avaturnApiKey = this.configService.get<string>('AVATURN_API_KEY');
      let glbUrl: string;
      let thumbnailUrl: string | null = null;
      let source = 'upload';

      if (avaturnApiKey) {
        try {
          // Direkte Avaturn-API-Integration (vereinfacht)
          const FormData = (await import('form-data')).default;
          
          const formData = new FormData();
          formData.append('image', imageBuffer, {
            filename: 'avatar.jpg',
            contentType: 'image/jpeg',
          });
          formData.append('quality', 'premium');
          formData.append('enableMorphs', 'true');
          formData.append('enableRigs', 'true');

          const avaturnApiUrl = this.configService.get<string>('AVATURN_API_URL', 'https://api.avaturn.me');
          const response = await axios.post(
            `${avaturnApiUrl}/api/v1/avatars/create`,
            formData,
            {
              headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${avaturnApiKey}`,
              },
              timeout: 60000,
            },
          );

          glbUrl = response.data.glbUrl;
          thumbnailUrl = response.data.thumbnailUrl;
          source = 'avaturn';

          this.logger.log(`Avatar created via Avaturn: ${response.data.avatarId}`, {
            tenantId,
            name,
          });
        } catch (avaturnError) {
          // Fallback: Avatar ohne Avaturn erstellen
          this.logger.warn(
            `Avaturn integration failed, creating avatar without Avaturn: ${avaturnError instanceof Error ? avaturnError.message : 'Unknown error'}`,
          );
          glbUrl = `placeholder://avatar/${avatarId}.glb`;
          source = 'upload';
        }
      } else {
        this.logger.debug('Avaturn API key not configured, creating placeholder avatar');
        glbUrl = `placeholder://avatar/${avatarId}.glb`;
        source = 'upload';
      }

      // Avatar in DB speichern
      const avatar = await this.prisma.avatar.create({
        data: {
          id: avatarId,
          tenantId,
          characterId: characterId || null,
          name,
          glbUrl,
          thumbnailUrl,
          source,
          metadata: {},
        },
      });

      this.logger.log(`Avatar created: ${avatarId}`, { tenantId, name, source });

      return {
        id: avatar.id,
        name: avatar.name,
        glbUrl: avatar.glbUrl,
        thumbnailUrl: avatar.thumbnailUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create avatar: ${errorMessage}`);
      throw error;
    }
  }
}


