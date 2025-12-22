import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MvpController } from './mvp.controller';
import { MvpService } from './mvp.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule, HttpModule],
  controllers: [MvpController],
  providers: [MvpService],
  exports: [MvpService],
})
export class MvpModule {}

