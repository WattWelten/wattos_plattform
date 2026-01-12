/**
 * WattOS V2 Core Platform
 * 
 * Market-agnostic core components
 */

// Events
export * from './events/types';
export * from './events/bus.service';
export { EventHandler, EventEmitter, EVENT_HANDLER_METADATA } from './events/decorators';
export * from './events/middleware';
export * from './events/events.module';

// Orchestrator
export * from './orchestrator/runtime.service';
export * from './orchestrator/router.service';
export * from './orchestrator/state.service';
export * from './orchestrator/orchestrator.module';

// Multimodal
export * from './multimodal/text/streaming.service';
export * from './multimodal/voice/asr.service';
export * from './multimodal/voice/tts.service';
export * from './multimodal/multimodal.module';

// Knowledge
export * from './knowledge/rag/rag.service';
export * from './knowledge/tools/registry.service';
export * from './knowledge/tools/execution.service';
export * from './knowledge/workflows/workflow.service';
export * from './knowledge/knowledge.module';

// Observability
export * from './observability/trace.service';
export * from './observability/metrics.service';
export * from './observability/observability.module';

// Channels
export * from './channels/interfaces/channel.interface';
export * from './channels/channel-router.service';
export * from './channels/channels.module';

// Profiles
export * from './profiles/types';
export * from './profiles/profile.service';
export * from './profiles/feature-flags.service';
export * from './profiles/guards/feature.guard';
export * from './profiles/middleware/feature.middleware';
export * from './profiles/profiles.module';

// Providers
export * from './providers/provider-factory.service';
export * from './providers/providers.module';

// Agents
export * from './agents/conversation-agent';
export * from './agents/retrieval-agent';
export * from './agents/compliance-agent';
export * from './agents/media-agent';
export * from './agents/agents.module';

// DMS Integration
export * from './knowledge/dms/dms-integration.service';
export * from './knowledge/dms/dms.module';

// Avatar V2
export * from './multimodal/avatar/avatar-v2.service';
export * from './multimodal/avatar/avatar-v2.module';

// Compliance
export * from './compliance/disclosure.service';
export * from './compliance/source-cards.service';
export * from './compliance/audit-replay.service';
export * from './compliance/pii-redaction.service';
export * from './compliance/compliance.module';

// Analytics
export * from './analytics';