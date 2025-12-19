import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '@wattweiser/core';
import { F13Client } from '@wattweiser/f13';
import { KBSyncWorkerService } from './kb-sync-worker.service';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { IncrementalSyncService } from './incremental-sync.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    EventsModule,
  ],
  providers: [
    F13Client,
    KBSyncWorkerService,
    ApprovalWorkflowService,
    IncrementalSyncService,
  ],
  exports: [KBSyncWorkerService],
})
export class KBSyncWorkerModule {}

