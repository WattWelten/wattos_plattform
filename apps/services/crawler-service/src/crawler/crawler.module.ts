import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlerEngineService } from './crawler-engine.service';

@Module({
  imports: [HttpModule],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerEngineService],
  exports: [CrawlerService],
})
export class CrawlerModule {}














