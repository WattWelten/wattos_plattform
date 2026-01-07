import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlerEngineService } from './crawler-engine.service';
import { PrismaModule } from '@wattweiser/db';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerEngineService],
  exports: [CrawlerService],
})
export class CrawlerModule {}














