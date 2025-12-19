import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { AgentRuntimeService } from './runtime.service';
import { EventRouterService } from './router.service';
import { StateService } from './state.service';

/**
 * Orchestrator Module
 * 
 * Multi-Agenten-Orchestrierung
 */
@Module({
  imports: [EventsModule],
  providers: [AgentRuntimeService, EventRouterService, StateService],
  exports: [AgentRuntimeService, EventRouterService, StateService],
})
export class OrchestratorModule {}

