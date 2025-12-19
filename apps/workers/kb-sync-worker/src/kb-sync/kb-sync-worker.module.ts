import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from '@wattweiser/core';
import { KBSyncWorkerService } from './kb-sync-worker.service';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { IncrementalSyncService } from './incremental-sync.service';

@Module({
  imports: [HttpModule, EventsModule],
  providers: [
    KBSyncWorkerService,
    ApprovalWorkflowService,
    IncrementalSyncService,
  ],
  exports: [KBSyncWorkerService],
})
export class KBSyncWorkerModule {}

