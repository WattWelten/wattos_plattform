import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { F13Controller } from './f13.controller';
import { F13Service } from './f13.service';
import { KBSyncService } from './kb-sync.service';
import { F13RAGService } from './f13-rag.service';
import { F13ChatService } from './f13-chat.service';
import { F13Client, F13LLMProvider, F13RAGProvider } from '@wattweiser/f13';

@Module({
  imports: [HttpModule],
  controllers: [F13Controller],
  providers: [
    F13Service,
    KBSyncService,
    F13RAGService,
    F13ChatService,
    F13Client,
    F13LLMProvider,
    F13RAGProvider,
  ],
  exports: [F13Service, KBSyncService],
})
export class F13Module {}

