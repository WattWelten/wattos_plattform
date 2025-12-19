import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Event, EventHandler } from '../events/types';

/**
 * Agent Runtime
 * 
 * Verwaltet Agent-Instanzen und deren Lifecycle
 */
export interface Agent {
  readonly name: string;
  readonly version: string;
  handle(event: Event): Promise<Event | null>;
  healthCheck(): Promise<boolean>;
}

@Injectable()
export class AgentRuntimeService {
  private readonly logger = new Logger(AgentRuntimeService.name);
  private readonly agents: Map<string, Agent> = new Map();
  private handlers: Map<string, EventHandler[]> = new Map();

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Agent registrieren
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
    this.logger.log(`Agent registered: ${agent.name} v${agent.version}`);
  }

  /**
   * Agent entfernen
   */
  unregisterAgent(agentName: string): void {
    this.agents.delete(agentName);
    this.logger.log(`Agent unregistered: ${agentName}`);
  }

  /**
   * Agent abrufen
   */
  getAgent(agentName: string): Agent | undefined {
    return this.agents.get(agentName);
  }

  /**
   * Alle Agenten auflisten
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Event an Agent weiterleiten
   */
  async routeEvent(event: Event, agentName?: string): Promise<Event | null> {
    if (agentName) {
      const agent = this.getAgent(agentName);
      if (!agent) {
        this.logger.warn(`Agent not found: ${agentName}`);
        return null;
      }

      try {
        return await agent.handle(event);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Error in agent ${agentName}: ${errorMessage}`, errorStack);
        return null;
      }
    }

    // Wenn kein Agent spezifiziert, versuche alle Agenten
    const results: (Event | null)[] = await Promise.all(
      Array.from(this.agents.values()).map((agent) =>
        agent.handle(event).catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Error in agent ${agent.name}: ${errorMessage}`);
          return null;
        }),
      ),
    );

    // Gib das erste nicht-null Ergebnis zurück
    return results.find((result) => result !== null) || null;
  }

  /**
   * Health Check für alle Agenten
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    await Promise.all(
      Array.from(this.agents.entries()).map(async ([name, agent]) => {
        try {
          health[name] = await agent.healthCheck();
        } catch {
          health[name] = false;
        }
      }),
    );

    return health;
  }
}

