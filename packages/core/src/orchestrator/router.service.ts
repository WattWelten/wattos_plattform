import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { AgentRuntimeService } from './runtime.service';
import { Event, EventDomain } from '../events/types';

/**
 * Event Router Service
 * 
 * Routet Events basierend auf Domain und Action zu den entsprechenden Agenten
 */
@Injectable()
export class EventRouterService {
  private readonly logger = new Logger(EventRouterService.name);
  private routingRules: Map<string, string[]> = new Map();

  constructor(
    private readonly eventBus: EventBusService,
    private readonly agentRuntime: AgentRuntimeService,
  ) {
    this.setupDefaultRouting();
    this.subscribeToEvents();
  }

  /**
   * Standard-Routing-Regeln einrichten
   */
  private setupDefaultRouting(): void {
    // Perception Events → Media Agent
    this.routingRules.set(`${EventDomain.PERCEPTION}.*`, ['media-agent']);

    // Intent Events → Conversation Agent
    this.routingRules.set(`${EventDomain.INTENT}.*`, ['conversation-agent']);

    // Knowledge Events → Retrieval Agent
    this.routingRules.set(`${EventDomain.KNOWLEDGE}.*`, ['retrieval-agent']);

    // Tool Events → Tool Agent
    this.routingRules.set(`${EventDomain.TOOL}.*`, ['tool-agent']);

    // Compliance Events → Compliance Agent
    this.routingRules.set(`${EventDomain.COMPLIANCE}.*`, ['compliance-agent']);

    // Avatar Events → Media Agent
    this.routingRules.set(`${EventDomain.AVATAR}.*`, ['media-agent']);

    // Channel Events → Conversation Agent
    this.routingRules.set(`${EventDomain.CHANNEL}.*`, ['conversation-agent']);
  }

  /**
   * Routing-Regel hinzufügen
   */
  addRoutingRule(eventPattern: string, agentNames: string[]): void {
    this.routingRules.set(eventPattern, agentNames);
    this.logger.log(`Routing rule added: ${eventPattern} → ${agentNames.join(', ')}`);
  }

  /**
   * Routing-Regel entfernen
   */
  removeRoutingRule(eventPattern: string): void {
    this.routingRules.delete(eventPattern);
    this.logger.log(`Routing rule removed: ${eventPattern}`);
  }

  /**
   * Event zu Event-Bus subscriben
   */
  private subscribeToEvents(): void {
    // Subscribe zu allen Event-Domains
    Object.values(EventDomain).forEach((domain) => {
      this.eventBus.subscribe(`${domain}.*`, async (event: Event) => {
        await this.routeEvent(event);
      });
    });
  }

  /**
   * Event routen
   */
  async routeEvent(event: Event): Promise<void> {
    const eventPattern = `${event.domain}.*`;
    const agentNames = this.routingRules.get(eventPattern) || [];

    if (agentNames.length === 0) {
      this.logger.debug(`No routing rule found for event: ${event.type}`);
      return;
    }

    // Route zu allen spezifizierten Agenten
    await Promise.all(
      agentNames.map(async (agentName) => {
        try {
          const result = await this.agentRuntime.routeEvent(event, agentName);
          if (result) {
            // Emit result event
            await this.eventBus.emit(result);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Error routing event to ${agentName}: ${errorMessage}`, errorStack);
        }
      }),
    );
  }

  /**
   * Event manuell routen
   */
  async routeEventToAgent(event: Event, agentName: string): Promise<Event | null> {
    return await this.agentRuntime.routeEvent(event, agentName);
  }
}
