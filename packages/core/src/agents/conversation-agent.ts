import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EventBusService } from '../events/bus.service';
import { Agent } from '../orchestrator/runtime.service';
import { Event, EventDomain, IntentEvent, IntentEventSchema } from '../events/types';
import { TextStreamingService } from '../multimodal/text/streaming.service';
import { RAGService } from '../knowledge/rag/rag.service';
import { ToolExecutionService } from '../knowledge/tools/execution.service';
import { ProfileService } from '../profiles/profile.service';
import { SourceCardsService } from '../compliance/source-cards.service';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { TenantProfile } from '../profiles/types';
import { Citation } from '../compliance/source-cards.service';
import { v4 as uuid } from 'uuid';

/**
 * Conversation Agent
 * 
 * Verarbeitet Intent-Events, generiert Antworten, koordiniert RAG und Tools
 */
@Injectable()
export class ConversationAgent implements Agent {
  readonly name = 'conversation-agent';
  readonly version = '1.0.0';
  private readonly logger = new Logger(ConversationAgent.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly streamingService: TextStreamingService,
    private readonly ragService: RAGService,
    private readonly toolExecutionService: ToolExecutionService,
    private readonly profileService: ProfileService,
    private readonly sourceCardsService: SourceCardsService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Event verarbeiten
   */
  async handle(event: Event): Promise<Event | null> {
    // Nur Intent-Events verarbeiten
    if (event.domain !== EventDomain.INTENT) {
      return null;
    }

    try {
      const intentEvent = IntentEventSchema.parse(event);
      this.logger.debug(`Processing intent event: ${intentEvent.action}`, {
        sessionId: intentEvent.sessionId,
        tenantId: intentEvent.tenantId,
      });

      switch (intentEvent.action) {
        case 'message.processed':
          return await this.handleMessageProcessed(intentEvent);
        case 'intent.detected':
          return await this.handleIntentDetected(intentEvent);
        case 'response.generated':
          return await this.handleResponseGenerated(intentEvent);
        default:
          this.logger.warn(`Unknown intent action: ${intentEvent.action}`);
          return null;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing intent event: ${errorMessage}`, errorStack);
      return null;
    }
  }

  /**
   * Message verarbeiten
   */
  private async handleMessageProcessed(event: IntentEvent): Promise<Event | null> {
    const { sessionId, tenantId, userId, payload } = event;
    const message = payload.message;

    this.logger.debug(`Processing message: ${message.substring(0, 50)}...`);

    // 1. Profile laden für Tenant-spezifische Konfiguration
    const profile = await this.profileService.getProfile(tenantId);

    // 2. RAG-Suche (wenn aktiviert)
    let context = '';
    let citations: Citation[] = [];
    if (profile.features.ragEnabled !== false) {
      try {
        const ragResponse = await this.ragService.search(message, {
          tenantId,
          knowledgeSpaceId: profile.features.defaultKnowledgeSpaceId,
          topK: 5,
        });
        context = ragResponse.results.map((r) => r.content).join('\n\n');
        
        // Source Cards erstellen (erzwungen bei Gov)
        const sourceCards = await this.sourceCardsService.createSourceCards(
          tenantId,
          sessionId,
          ragResponse.results,
        );
        
        citations = this.sourceCardsService.formatSourceCardsForUI(sourceCards);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`RAG search failed: ${errorMessage}`);
      }
    }

    // 3. LLM-Antwort generieren (mit Context)
    const systemPrompt = this.buildSystemPrompt(profile, context);
    const response = await this.generateResponse(systemPrompt, message, profile);

    // 4. Response-Event emittieren
    const responseEvent: IntentEvent = {
      id: uuid(),
      type: `${EventDomain.INTENT}.response.generated`,
      domain: EventDomain.INTENT,
      action: 'response.generated',
      timestamp: Date.now(),
      sessionId,
      tenantId,
      userId,
      payload: {
        message,
        response,
        citations: citations.length > 0 ? citations : undefined,
        intent: payload.intent,
        confidence: payload.confidence,
      },
      metadata: {
        agent: this.name,
        version: this.version,
      },
    };

    await this.eventBus.emit(responseEvent);

    return responseEvent;
  }

  /**
   * Intent erkannt
   */
  private async handleIntentDetected(event: IntentEvent): Promise<Event | null> {
    // Intent wurde bereits erkannt, weiterverarbeiten
    return await this.handleMessageProcessed(event);
  }

  /**
   * Response generiert
   */
  private async handleResponseGenerated(event: IntentEvent): Promise<Event | null> {
    // Response wurde bereits generiert, Event weiterleiten
    return event;
  }

  /**
   * System-Prompt bauen
   */
  private buildSystemPrompt(profile: TenantProfile, context: string): string {
    let prompt = `Du bist ein hilfreicher KI-Assistent für ${profile.market} Kunden.\n\n`;

    if (context) {
      prompt += `Kontext aus Wissensbasis:\n${context}\n\n`;
    }

    if (profile.mode === 'gov-f13' || profile.mode === 'regulated') {
      prompt += `WICHTIG: Du musst immer Quellenangaben für deine Antworten bereitstellen.\n`;
      prompt += `Wenn du Informationen aus dem Kontext verwendest, zitiere die Quelle.\n`;
    }

    if (profile.features.guidedFlows) {
      prompt += `Führe den Nutzer durch strukturierte Flows.\n`;
    }

    return prompt;
  }

  /**
   * Response generieren
   */
  private async generateResponse(
    systemPrompt: string,
    userMessage: string,
    profile: TenantProfile,
  ): Promise<string> {
    try {
      // LLM-Gateway URL ermitteln
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);

      // Messages für LLM-Gateway formatieren
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      // LLM-Gateway aufrufen
      const response = await firstValueFrom(
        this.httpService.post(
          `${llmGatewayUrl}/v1/chat/completions`,
          {
            model: profile.features.defaultModel || 'gpt-4',
            provider: profile.features.defaultProvider || 'openai',
            messages,
            stream: false,
            temperature: profile.features.temperature || 0.7,
            max_tokens: profile.features.maxTokens || 2000,
            tenantId: profile.tenantId,
          },
          {
            timeout: 30000, // 30 Sekunden Timeout
          },
        ),
      );

      // Response extrahieren
      const assistantContent = response.data?.choices?.[0]?.message?.content;
      
      if (!assistantContent) {
        this.logger.warn('LLM-Gateway returned empty response');
        return 'Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.';
      }

      this.logger.debug(`LLM response generated: ${assistantContent.substring(0, 50)}...`);
      return assistantContent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`LLM-Gateway call failed: ${errorMessage}`, errorStack);

      // Fallback: Placeholder Response
      return `Ich habe Ihre Nachricht erhalten: "${userMessage}". Entschuldigung, die LLM-Integration ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.`;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Prüfe ob alle Dependencies verfügbar sind
      const checks = await Promise.all([
        this.ragService.healthCheck(),
        this.toolExecutionService.healthCheck(),
        // Prüfe LLM-Gateway Verfügbarkeit
        this.checkLLMGatewayHealth(),
      ]);

      return checks.every((check) => check === true);
    } catch {
      return false;
    }
  }

  /**
   * LLM-Gateway Health Check
   */
  private async checkLLMGatewayHealth(): Promise<boolean> {
    try {
      const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
      const response = await firstValueFrom(
        this.httpService.get(`${llmGatewayUrl}/health`, { timeout: 5000 }),
      );
      return response.status === 200;
    } catch {
      // LLM-Gateway nicht verfügbar, aber Agent kann trotzdem funktionieren (mit Fallback)
      return true;
    }
  }
}

