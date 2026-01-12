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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

    const createVideoDto: CreateVideoDto = {
      tenantId: body.tenantId,
      avatarId: body.avatarId,
      title: body.title,
      description: body.description,
      agentId: body.agentId,
      metadata: body.metadata ? JSON.parse(body.metadata) : undefined,
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
   */
  @Get(':videoId/download')
  async downloadVideo(
    @Param('videoId') videoId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<Buffer> {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    const { buffer } = await this.videoService.getVideoFile(videoId, tenantId);
    return buffer;
  }
}
