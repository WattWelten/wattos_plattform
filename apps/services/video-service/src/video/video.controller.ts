import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoResponseDto } from './dto/video-response.dto';

@ApiTags('videos')
@Controller('api/v1/videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Video hochladen (WebM/MP4)
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // P1-2: Rate-Limiting für Uploads (10/Minute)
  async uploadVideo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 104857600 }), // 100MB
          new FileTypeValidator({ fileType: /(webm|mp4)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: { tenantId: string; avatarId: string; title: string; description?: string; agentId?: string; metadata?: string },
  ): Promise<VideoResponseDto> {
    if (!body.tenantId || !body.avatarId || !body.title) {
      throw new BadRequestException('tenantId, avatarId, and title are required');
    }

    // P0-3: JSON.parse Error-Handling
    let metadata: Record<string, unknown> | undefined;
    if (body.metadata) {
      try {
        metadata = JSON.parse(body.metadata);
      } catch (error) {
        throw new BadRequestException('Invalid metadata JSON format');
      }
    }

    const createVideoDto: CreateVideoDto = {
      tenantId: body.tenantId,
      avatarId: body.avatarId,
      title: body.title,
      description: body.description,
      agentId: body.agentId,
      metadata,
    };

    return this.videoService.uploadVideo(file, createVideoDto);
  }

  /**
   * Video-Liste abrufen (pro Tenant)
   */
  @Get()
  async getVideos(@Query('tenantId') tenantId: string): Promise<VideoResponseDto[]> {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    return this.videoService.getVideos(tenantId);
  }

  /**
   * Einzelnes Video abrufen
   */
  @Get(':videoId')
  async getVideo(
    @Param('videoId') videoId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<VideoResponseDto> {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    return this.videoService.getVideo(videoId, tenantId);
  }

  /**
   * Video löschen
   */
  @Delete(':videoId')
  async deleteVideo(
    @Param('videoId') videoId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<{ message: string }> {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    await this.videoService.deleteVideo(videoId, tenantId);
    return { message: 'Video deleted successfully' };
  }

  /**
   * Video-Stream/Download
   * P2-2: Unterstützt Streaming für große Videos
   */
  @Get(':videoId/download')
  async downloadVideo(
    @Param('videoId') videoId: string,
    @Query('tenantId') tenantId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    
    const fileData = await this.videoService.getVideoFile(videoId, tenantId);
    
    res.setHeader('Content-Type', fileData.contentType);
    res.setHeader('Content-Length', fileData.fileSize.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    
    // P2-2: Streaming für große Videos
    if (fileData.stream) {
      fileData.stream.pipe(res);
    } else if (fileData.buffer) {
      res.send(fileData.buffer);
    } else {
      throw new BadRequestException('Video file not available');
    }
  }
}
