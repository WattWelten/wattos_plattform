import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { DisclosureService } from './disclosure.service';
import { SourceCardsService } from './source-cards.service';
import { AuditReplayService } from './audit-replay.service';
import { PIIRedactionService } from './pii-redaction.service';
import { RetentionPolicyService } from './retention-policy.service';

/**
 * Compliance Module
 * 
 * Compliance-Features: Disclosure, Source Cards, Audit & Replay, PII-Redaction, Retention-Policies
 */
@Module({
  imports: [EventsModule, ProfilesModule, KnowledgeModule],
  providers: [
    DisclosureService,
    SourceCardsService,
    AuditReplayService,
    PIIRedactionService,
    RetentionPolicyService,
  ],
  exports: [
    DisclosureService,
    SourceCardsService,
    AuditReplayService,
    PIIRedactionService,
    RetentionPolicyService,
  ],
})
export class ComplianceModule {}

