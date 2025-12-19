import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { RAGService } from './rag/rag.service';
import { ToolRegistryService } from './tools/registry.service';
import { ToolExecutionService } from './tools/execution.service';
import { WorkflowService } from './workflows/workflow.service';
import { DMSModule } from './dms/dms.module';

/**
 * Knowledge Module
 * 
 * Knowledge & Action Layer
 */
@Module({
  imports: [EventsModule, DMSModule],
  providers: [RAGService, ToolRegistryService, ToolExecutionService, WorkflowService],
  exports: [RAGService, ToolRegistryService, ToolExecutionService, WorkflowService, DMSModule],
})
export class KnowledgeModule {}

