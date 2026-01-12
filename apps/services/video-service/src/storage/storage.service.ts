import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType: string;
  private readonly localPath: string;
  private readonly cdnUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.storageType = this.configService.get<string>('storage.type', 'local');
    this.localPath = this.configService.get<string>('storage.localPath', './storage/videos');
    this.cdnUrl = this.configService.get<string>('storage.cdnUrl');
  }

  /**
   * Video-Datei speichern
   */
  async saveVideo(
    tenantId: string,
    videoId: string,
    fileBuffer: Buffer,
    format: string = 'webm',
  ): Promise<string> {
    if (this.storageType === 'local') {
      return this.saveLocal(tenantId, videoId, fileBuffer, format);
    }
    // TODO: S3/MinIO Integration
    throw new Error(`Storage type ${this.storageType} not implemented yet`);
  }

  /**
   * Lokale Speicherung
   */
  private async saveLocal(
    tenantId: string,
    videoId: string,
    fileBuffer: Buffer,
    format: string,
  ): Promise<string> {
    const tenantPath = path.join(this.localPath, tenantId);
    await fs.mkdir(tenantPath, { recursive: true });

    const fileName = `${videoId}.${format}`;
    const filePath = path.join(tenantPath, fileName);

    await fs.writeFile(filePath, fileBuffer);

    this.logger.log(`Video saved locally: ${filePath}`);

    // Return relative URL or CDN URL
    // Prüfe ob es ein Thumbnail ist (jpg/png) oder Video
    const isThumbnail = format === 'jpg' || format === 'png';
    const basePath = isThumbnail ? 'thumbnails' : 'videos';
    
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${basePath}/${tenantId}/${fileName}`;
    }
    return `/${basePath}/${tenantId}/${fileName}`;
  }

  /**
   * Video-Datei abrufen
   */
  async getVideo(tenantId: string, videoId: string, format: string = 'webm'): Promise<Buffer> {
    if (this.storageType === 'local') {
      return this.getLocal(tenantId, videoId, format);
    }
    throw new Error(`Storage type ${this.storageType} not implemented yet`);
  }

  /**
   * Lokale Datei abrufen
   */
  private async getLocal(tenantId: string, videoId: string, format: string): Promise<Buffer> {
    const fileName = `${videoId}.${format}`;
    const filePath = path.join(this.localPath, tenantId, fileName);

    try {
      return await fs.readFile(filePath);
    } catch (error) {
      this.logger.error(`Failed to read video file: ${filePath}`, error);
      throw new Error(`Video file not found: ${videoId}`);
    }
  }

  /**
   * Video-Datei löschen
   */
  async deleteVideo(tenantId: string, videoId: string, format: string = 'webm'): Promise<void> {
    if (this.storageType === 'local') {
      return this.deleteLocal(tenantId, videoId, format);
    }
    throw new Error(`Storage type ${this.storageType} not implemented yet`);
  }

  /**
   * Thumbnail speichern (kann auch für andere Bildformate verwendet werden)
   */
  async saveThumbnail(
    tenantId: string,
    thumbnailId: string,
    imageBuffer: Buffer,
    format: string = 'jpg',
  ): Promise<string> {
    if (this.storageType === 'local') {
      return this.saveLocalThumbnail(tenantId, thumbnailId, imageBuffer, format);
    }
    throw new Error(`Storage type ${this.storageType} not implemented yet`);
  }

  /**
   * Lokale Thumbnail-Speicherung
   */
  private async saveLocalThumbnail(
    tenantId: string,
    thumbnailId: string,
    imageBuffer: Buffer,
    format: string,
  ): Promise<string> {
    const thumbnailPath = path.join(this.localPath, '..', 'thumbnails', tenantId);
    await fs.mkdir(thumbnailPath, { recursive: true });

    const fileName = `${thumbnailId}.${format}`;
    const filePath = path.join(thumbnailPath, fileName);

    await fs.writeFile(filePath, imageBuffer);

    this.logger.log(`Thumbnail saved locally: ${filePath}`);

    // Return relative URL or CDN URL
    if (this.cdnUrl) {
      return `${this.cdnUrl}/thumbnails/${tenantId}/${fileName}`;
    }
    return `/thumbnails/${tenantId}/${fileName}`;
  }

  /**
   * Lokale Datei löschen
   */
  private async deleteLocal(tenantId: string, videoId: string, format: string): Promise<void> {
    const fileName = `${videoId}.${format}`;
    const filePath = path.join(this.localPath, tenantId, fileName);

    try {
      await fs.unlink(filePath);
      this.logger.log(`Video deleted: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete video file: ${filePath}`, error);
      // Don't throw - file might not exist
    }
  }
}
