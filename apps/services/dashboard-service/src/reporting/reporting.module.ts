import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ReportGeneratorService } from './report-generator.service';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, ReportGeneratorService],
  exports: [ReportingService],
})
export class ReportingModule {}

