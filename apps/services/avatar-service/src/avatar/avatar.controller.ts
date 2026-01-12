import { Controller, Post, Get, Param, Body, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { AvatarService } from './avatar.service';

@ApiTags('avatars')
@Controller('api/v1/avatars')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post(':agentId/generate')
  async generateAvatar(
    @Param('agentId') agentId: string,
    @Body() body: { text: string; voiceId?: string },
  ) {
    return this.avatarService.generateAvatar(agentId, body.text, body.voiceId);
  }

  @Get(':agentId/stream')
  async streamAvatar(@Param('agentId') agentId: string) {
    return this.avatarService.streamAvatar(agentId);
  }

  @Get(':agentId/scene')
  async getAvatarScene(@Param('agentId') agentId: string) {
    return this.avatarService.exportAvatarScene(agentId);
  }

  @Get(':agentId/video')
  async getAvatarVideo(@Param('agentId') agentId: string) {
    return { videoUrl: `/api/v1/avatars/${agentId}/video/stream` };
  }

  /**
   * Avatar-Liste für Tenant abrufen
   */
  @Get('tenant/:tenantId')
  async getAvatarsForTenant(@Param('tenantId') tenantId: string) {
    return this.avatarService.getAvatarsForTenant(tenantId);
  }

  /**
   * Avatar erstellen (aus Bild)
   */
  @Post('create')
  @UseInterceptors(FileInterceptor('image'))
  async createAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { tenantId: string; name: string; characterId?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    if (!body.tenantId || !body.name) {
      throw new BadRequestException('tenantId and name are required');
    }

    return this.avatarService.createAvatar(
      body.tenantId,
      file.buffer,
      body.name,
      body.characterId,
    );
  }
}


