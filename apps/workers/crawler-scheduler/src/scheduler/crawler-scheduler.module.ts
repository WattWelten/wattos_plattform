import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrawlerSchedulerService } from './crawler-scheduler.service';
import { CrawlJobService } from './crawl-job.service';
import { IncrementalCrawlService } from './incremental-crawl.service';

@Module({
  imports: [HttpModule],
  providers: [
    CrawlerSchedulerService,
    CrawlJobService,
    IncrementalCrawlService,
  ],
  exports: [CrawlerSchedulerService],
})
export class CrawlerSchedulerModule {}


