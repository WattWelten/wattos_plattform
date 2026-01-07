import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@wattweiser/db';
import { ServiceDiscoveryModule } from '@wattweiser/shared';
import { CrawlerSchedulerService } from './crawler-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    PrismaModule,
    ServiceDiscoveryModule,
  ],
  providers: [CrawlerSchedulerService],
  exports: [CrawlerSchedulerService],
})
export class CrawlerSchedulerModule {}










