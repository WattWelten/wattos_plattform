import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { MetaverseService } from './metaverse.service';

@Controller('metaverse')
export class MetaverseController {
  constructor(private readonly service: MetaverseService) {}

  @Post('rooms')
  async createRoom(@Body('name') name: string) {
    return this.service.createRoom(name);
  }

  @Get('rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string) {
    return this.service.getRoom(roomId);
  }
}


