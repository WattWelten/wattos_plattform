import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { DataAggregationService } from './data-aggregation.service';
import { TargetGroupService } from './target-group.service';
import { PersonasModule } from '../personas/personas.module';

@Module({
  imports: [HttpModule, PersonasModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, DataAggregationService, TargetGroupService],
  exports: [AnalysisService, TargetGroupService],
})
export class AnalysisModule {}

