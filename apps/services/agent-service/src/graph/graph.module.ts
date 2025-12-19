import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GraphService } from './graph.service';
import { GraphStateService } from './graph-state.service';

@Module({
  imports: [HttpModule],
  providers: [GraphService, GraphStateService],
  exports: [GraphService, GraphStateService],
})
export class GraphModule {}


