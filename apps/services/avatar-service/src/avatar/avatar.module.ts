import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';
import { PrismaModule } from '@wattweiser/db';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [AvatarController],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}


