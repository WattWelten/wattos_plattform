import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { StorageService } from '../storage/storage.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoResponseDto } from './dto/video-response.dto';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly maxFileSize: number;
  private readonly allowedFormats: string[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.get<number>('video.maxFileSize', 104857600);
    this.allowedFormats = this.configService.get<string[]>('video.allowedFormats', ['webm', 'mp4']);
  }

  /**
   * Video hochladen und speichern
   * Sicher: File-Content-Validierung, Transaktionen, Error-Handling
   */
  async uploadVideo(
    file: Express.Multer.File,
    createVideoDto: CreateVideoDto,
  ): Promise<VideoResponseDto> {
    // Validierung
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum of ${this.maxFileSize} bytes`);
    }

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(`File format not allowed. Allowed formats: ${this.allowedFormats.join(', ')}`);
    }

    // File-Content-Validierung (P0-2: Sicherheit)
    try {
      const { fileTypeFromBuffer } = await import('file-type');
      const fileType = await fileTypeFromBuffer(file.buffer);
      
      if (!fileType || !['video/webm', 'video/mp4', 'video/x-matroska'].includes(fileType.mime)) {
        throw new BadRequestException('Invalid video file content. File must be a valid video file.');
      }
      
      // Zusätzliche Validierung: Extension muss zu MIME-Type passen
      const expectedMimeTypes: Record<string, string[]> = {
        webm: ['video/webm', 'video/x-matroska'],
        mp4: ['video/mp4'],
      };
      
      if (fileExtension && expectedMimeTypes[fileExtension] && !expectedMimeTypes[fileExtension].includes(fileType.mime)) {
        throw new BadRequestException(`File extension (${fileExtension}) does not match file content (${fileType.mime})`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`File type detection failed, continuing with extension validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Prüfe ob Avatar existiert
    const avatar = await this.prisma.avatar.findFirst({
      where: {
        id: createVideoDto.avatarId,
        tenantId: createVideoDto.tenantId,
      },
    });

    if (!avatar) {
      throw new NotFoundException(`Avatar not found: ${createVideoDto.avatarId}`);
    }

    // P0-4: Transaktion für atomare Operationen
    return await this.prisma.$transaction(async (tx) => {
      const videoId = randomUUID();
      
      try {
        // Video in Storage speichern
        const videoUrl = await this.storageService.saveVideo(
          createVideoDto.tenantId,
          videoId,
          file.buffer,
          fileExtension,
        );

        // Video-Metadaten extrahieren (mit FFmpeg)
        const duration = await this.extractDuration(file.buffer, fileExtension);
        const resolution = await this.extractResolution(file.buffer, fileExtension);

        // Thumbnail generieren (optional)
        const thumbnailUrl = await this.generateThumbnail(
          createVideoDto.tenantId,
          videoId,
          file.buffer,
          fileExtension,
        );

        // Video in DB speichern
        const video = await tx.video.create({
          data: {
            id: videoId,
            tenantId: createVideoDto.tenantId,
            avatarId: createVideoDto.avatarId,
            agentId: createVideoDto.agentId,
            title: createVideoDto.title,
            description: createVideoDto.description,
            videoUrl,
            thumbnailUrl,
            duration: duration || 0,
            fileSize: BigInt(file.size),
            format: fileExtension,
            resolution: resolution || '1920x1080',
            status: 'completed',
            metadata: createVideoDto.metadata || {},
          },
        });

        this.logger.log(`Video uploaded: ${videoId}`, {
          tenantId: createVideoDto.tenantId,
          avatarId: createVideoDto.avatarId,
          size: file.size,
        });

        return this.toResponseDto(video);
      } catch (error) {
        // Bei Fehler: Storage-Datei löschen falls erstellt
        try {
          await this.storageService.deleteVideo(createVideoDto.tenantId, videoId, fileExtension).catch(() => {});
        } catch {
          // Ignore cleanup errors
        }
        this.logger.error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    });
  }

  /**
   * Video-Liste abrufen (pro Tenant)
   */
  async getVideos(tenantId: string): Promise<VideoResponseDto[]> {
    const videos = await this.prisma.video.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    return videos.map((video) => this.toResponseDto(video));
  }

  /**
   * Einzelnes Video abrufen
   */
  async getVideo(videoId: string, tenantId: string): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findFirst({
      where: {
        id: videoId,
        tenantId,
      },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException(`Video not found: ${videoId}`);
    }

    return this.toResponseDto(video);
  }

  /**
   * Video löschen
   */
  async deleteVideo(videoId: string, tenantId: string): Promise<void> {
    const video = await this.prisma.video.findFirst({
      where: {
        id: videoId,
        tenantId,
      },
    });

    if (!video) {
      throw new NotFoundException(`Video not found: ${videoId}`);
    }

    // Video aus Storage löschen
    await this.storageService.deleteVideo(tenantId, videoId, video.format);

    // Video aus DB löschen
    await this.prisma.video.delete({
      where: { id: videoId },
    });

    this.logger.log(`Video deleted: ${videoId}`);
  }

  /**
   * Video-Datei abrufen (für Download/Stream)
   * P2-2: Unterstützt Streaming für große Videos
   */
  async getVideoFile(videoId: string, tenantId: string): Promise<{ 
    stream?: NodeJS.ReadableStream; 
    buffer?: Buffer; 
    format: string; 
    contentType: string;
    fileSize: bigint;
  }> {
    const video = await this.prisma.video.findFirst({
      where: {
        id: videoId,
        tenantId,
      },
    });

    if (!video) {
      throw new NotFoundException(`Video not found: ${videoId}`);
    }

    const contentType = video.format === 'mp4' ? 'video/mp4' : 'video/webm';
    
    // P2-2: Streaming für große Videos (ab 10MB)
    const useStreaming = video.fileSize > BigInt(10 * 1024 * 1024); // 10MB
    
    if (useStreaming) {
      // Streaming-Modus für große Dateien
      const { join } = await import('path');
      const localPath = this.configService.get<string>('storage.localPath', './storage/videos');
      const filePath = join(localPath, tenantId, `${videoId}.${video.format}`);
      
      try {
        const stream = fs.createReadStream(filePath);
        return { stream, format: video.format, contentType, fileSize: video.fileSize };
      } catch (error) {
        this.logger.warn(`Streaming failed, falling back to buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fallback zu Buffer
      }
    }
    
    // Buffer-Modus für kleine Dateien oder Fallback
    const buffer = await this.storageService.getVideo(tenantId, videoId, video.format);
    return { buffer, format: video.format, contentType, fileSize: video.fileSize };
  }

  /**
   * Dauer aus Video extrahieren (mit FFmpeg)
   * Sicher: Verwendet execFile statt exec um Command Injection zu verhindern
   */
  private async extractDuration(buffer: Buffer, format: string): Promise<number | null> {
    try {
      // Versuche FFmpeg zu verwenden (wenn verfügbar)
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);
      const { writeFile, unlink } = await import('fs/promises');
      const { join } = await import('path');
      const { tmpdir } = await import('os');

      const tempFile = join(tmpdir(), `video-${Date.now()}-${randomUUID()}.${format}`);
      await writeFile(tempFile, buffer);

      try {
        // FFmpeg-Befehl: ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1
        // Sicher: execFile verhindert Command Injection
        const { stdout } = await execFileAsync(
          'ffprobe',
          [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            tempFile,
          ],
          {
            timeout: 30000, // 30 Sekunden Timeout
            maxBuffer: 1024 * 1024 * 10, // 10MB max output
          },
        );
        const duration = parseFloat(stdout.trim());
        await unlink(tempFile).catch(() => {});
        return Math.floor(duration);
      } catch (ffmpegError) {
        this.logger.warn(`FFmpeg not available, using fallback: ${ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'}`);
        await unlink(tempFile).catch(() => {});
        return null;
      }
    } catch (error) {
      this.logger.warn(`Failed to extract duration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Auflösung aus Video extrahieren (mit FFmpeg)
   * Sicher: Verwendet execFile statt exec um Command Injection zu verhindern
   */
  private async extractResolution(buffer: Buffer, format: string): Promise<string | null> {
    try {
      // Versuche FFmpeg zu verwenden (wenn verfügbar)
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);
      const { writeFile, unlink } = await import('fs/promises');
      const { join } = await import('path');
      const { tmpdir } = await import('os');

      const tempFile = join(tmpdir(), `video-${Date.now()}-${randomUUID()}.${format}`);
      await writeFile(tempFile, buffer);

      try {
        // FFmpeg-Befehl: ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0
        // Sicher: execFile verhindert Command Injection
        const { stdout } = await execFileAsync(
          'ffprobe',
          [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height',
            '-of',
            'csv=s=x:p=0',
            tempFile,
          ],
          {
            timeout: 30000, // 30 Sekunden Timeout
            maxBuffer: 1024 * 1024 * 10, // 10MB max output
          },
        );
        const resolution = stdout.trim();
        await unlink(tempFile).catch(() => {});
        return resolution || '1920x1080';
      } catch (ffmpegError) {
        this.logger.warn(`FFmpeg not available, using fallback: ${ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'}`);
        await unlink(tempFile).catch(() => {});
        return '1920x1080';
      }
    } catch (error) {
      this.logger.warn(`Failed to extract resolution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return '1920x1080';
    }
  }

  /**
   * Thumbnail aus Video generieren (mit FFmpeg)
   * Sicher: Verwendet execFile statt exec um Command Injection zu verhindern
   */
  private async generateThumbnail(
    tenantId: string,
    videoId: string,
    videoBuffer: Buffer,
    format: string,
  ): Promise<string | null> {
    try {
      // Versuche FFmpeg zu verwenden (wenn verfügbar)
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);
      const { writeFile, readFile, unlink } = await import('fs/promises');
      const { join } = await import('path');
      const { tmpdir } = await import('os');

      const tempVideoFile = join(tmpdir(), `video-${Date.now()}-${randomUUID()}.${format}`);
      const tempThumbnailFile = join(tmpdir(), `thumbnail-${Date.now()}-${randomUUID()}.jpg`);

      await writeFile(tempVideoFile, videoBuffer);

      try {
        // FFmpeg-Befehl: Thumbnail bei 1 Sekunde extrahieren
        // Sicher: execFile verhindert Command Injection
        await execFileAsync(
          'ffmpeg',
          [
            '-i',
            tempVideoFile,
            '-ss',
            '00:00:01',
            '-vframes',
            '1',
            '-q:v',
            '2',
            tempThumbnailFile,
          ],
          {
            timeout: 30000, // 30 Sekunden Timeout
            maxBuffer: 1024 * 1024 * 10, // 10MB max output
          },
        );

        const thumbnailBuffer = await readFile(tempThumbnailFile);
        await unlink(tempVideoFile).catch(() => {});
        await unlink(tempThumbnailFile).catch(() => {});

        // Thumbnail in Storage speichern
        const thumbnailUrl = await this.storageService.saveThumbnail(
          tenantId,
          `${videoId}-thumb`,
          thumbnailBuffer,
          'jpg',
        );

        this.logger.log(`Thumbnail generated: ${thumbnailUrl}`);
        return thumbnailUrl;
      } catch (ffmpegError) {
        this.logger.warn(
          `FFmpeg not available, skipping thumbnail: ${ffmpegError instanceof Error ? ffmpegError.message : 'Unknown error'}`,
        );
        await unlink(tempVideoFile).catch(() => {});
        await unlink(tempThumbnailFile).catch(() => {});
        return null;
      }
    } catch (error) {
      this.logger.warn(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Video zu Response DTO konvertieren
   * Sicher: BigInt zu String/Number Konvertierung mit Overflow-Schutz
   */
  private toResponseDto(video: any): VideoResponseDto {
    // BigInt-Safe Konvertierung
    let fileSize: number;
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;
    if (video.fileSize <= BigInt(maxSafeInteger)) {
      fileSize = Number(video.fileSize);
    } else {
      // Für sehr große Dateien: als String oder null
      this.logger.warn(`File size exceeds MAX_SAFE_INTEGER, returning 0: ${video.fileSize}`);
      fileSize = 0; // Oder könnte als String zurückgegeben werden
    }
    
    return {
      id: video.id,
      tenantId: video.tenantId,
      avatarId: video.avatarId,
      agentId: video.agentId || undefined,
      title: video.title,
      description: video.description || undefined,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || undefined,
      duration: video.duration,
      fileSize,
      format: video.format,
      resolution: video.resolution,
      status: video.status,
      metadata: video.metadata as Record<string, unknown>,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }
}
