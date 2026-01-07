import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
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
import { SkillRouterService } from './skill-router.service';
import { createSearchToolConfig } from '../knowledge/tools/search-tool.config';
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // @ts-expect-error - unused but may be needed in future
    private readonly streamingService: TextStreamingService,
    private readonly ragService: RAGService,
    private readonly toolExecutionService: ToolExecutionService,
    private readonly profileService: ProfileService,
    private readonly sourceCardsService: SourceCardsService,
    private readonly skillRouter: SkillRouterService,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // @ts-expect-error - replaced with axios
    private readonly httpService: any,
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

    // 2. Skill erkennen und entsprechend handeln
    const skill = this.skillRouter.detectSkill(message, (event.payload as any).intent);
    let context = '';
    let citations: Citation[] = [];
    
    // RAG-Suche mit search_tool_config (wenn aktiviert)
    if (profile.features.ragEnabled !== false && (skill?.ragEnabled || !skill)) {
      try {
        // Search Tool Config erstellen
        const searchConfig = createSearchToolConfig({
          defaultTopK: 5,
          maxTopK: 20,
          minScore: 0.7,
          knowledgeSpaceId: profile.features.defaultKnowledgeSpaceId,
        });

        const ragResponse = await this.ragService.search(message, {
          tenantId,
          ...(searchConfig.knowledgeSpaceId && { knowledgeSpaceId: searchConfig.knowledgeSpaceId }),
          topK: searchConfig.defaultTopK,
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

    // 3. Character Role aus Event oder Profile ermitteln
    const characterRole = (event.payload as any).characterRole || profile.features.defaultCharacterRole;

    // 4. LLM-Antwort generieren (mit Context)
    const systemPrompt = await this.buildSystemPrompt(profile, context, characterRole);
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
  private async buildSystemPrompt(profile: TenantProfile, context: string, characterRole?: string): Promise<string> {
    // Versuche Character-spezifischen Prompt zu laden (z.B. Kaya)
    let characterPrompt: string | null = null;
    if (characterRole) {
      try {
        const character = await this.getCharacterByRole(profile.tenantId, characterRole);
        if (character?.systemPrompt) {
          characterPrompt = character.systemPrompt;
        } else if (character?.prompt) {
          characterPrompt = character.prompt;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.debug(`Failed to load character prompt: ${errorMessage}`);
      }
    }

    // Fallback: Kaya Prompt für Gov-Mode
    if (!characterPrompt && (profile.mode === 'gov-f13' || profile.mode === 'regulated')) {
      try {
        const { kayaSystemPrompt } = await import('@wattweiser/characters');
        characterPrompt = kayaSystemPrompt;
      } catch {
        // Kaya prompt nicht verfügbar, verwende Standard
      }
    }

    // Character Prompt verwenden oder Standard-Prompt
    let prompt = characterPrompt || `Du bist ein hilfreicher KI-Assistent für ${profile.market} Kunden.\n\n`;

    if (context) {
      prompt += `\nKontext aus Wissensbasis:\n${context}\n\n`;
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
   * Character nach Role abrufen
   */
  private async getCharacterByRole(tenantId: string, role: string): Promise<{ systemPrompt?: string; prompt?: string } | null> {
    try {
      // Character Service über Service Discovery aufrufen
      const characterServiceUrl = this.serviceDiscovery.getServiceUrl('character-service', 3013);
      const response = await axios.get(`${characterServiceUrl}/v1/characters`, {
        params: { tenantId, role },
        timeout: 5000,
      });
      return response.data || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.debug(`Failed to get character: ${errorMessage}`);
      return null;
    }
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
      const response = await axios.post(
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
      const response = await axios.get(`${llmGatewayUrl}/health`, { timeout: 5000 });
      return response.status === 200 || response.status === 204;
    } catch {
      // LLM-Gateway nicht verfügbar, aber Agent kann trotzdem funktionieren (mit Fallback)
      return true;
    }
  }
}

