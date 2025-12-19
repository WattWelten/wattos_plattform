import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { MultimodalModule } from '../multimodal/multimodal.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { ConversationAgent } from './conversation-agent';
import { RetrievalAgent } from './retrieval-agent';
import { ComplianceAgent } from './compliance-agent';
import { MediaAgent } from './media-agent';
import { AgentRuntimeService } from '../orchestrator/runtime.service';
import { AvatarV2Module } from '../multimodal/avatar/avatar-v2.module';

/**
 * Agents Module
 * 
 * Registriert alle Agents im Agent-Runtime
 */
@Module({
  imports: [EventsModule, KnowledgeModule, MultimodalModule, ProfilesModule, AvatarV2Module, ComplianceModule],
  providers: [
    ConversationAgent,
    RetrievalAgent,
    ComplianceAgent,
    MediaAgent,
  ],
  exports: [ConversationAgent, RetrievalAgent, ComplianceAgent, MediaAgent],
})
export class AgentsModule {
  constructor(
    private readonly agentRuntime: AgentRuntimeService,
    private readonly conversationAgent: ConversationAgent,
    private readonly retrievalAgent: RetrievalAgent,
    private readonly complianceAgent: ComplianceAgent,
    private readonly mediaAgent: MediaAgent,
  ) {
    // Registriere alle Agents beim Start
    this.agentRuntime.registerAgent(this.conversationAgent);
    this.agentRuntime.registerAgent(this.retrievalAgent);
    this.agentRuntime.registerAgent(this.complianceAgent);
    this.agentRuntime.registerAgent(this.mediaAgent);
  }
}

