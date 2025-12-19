import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { AvatarService } from './avatar.service';

@Controller('api/v1/avatar')
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
    return { videoUrl: `/api/v1/avatar/${agentId}/video/stream` };
  }
}


