/**
 * Skill Router Service
 * 
 * Routet Anfragen basierend auf erkannten Skills/Intents zu spezifischen Tools oder Agenten
 */

import { Injectable, Logger } from '@nestjs/common';
import { ToolRegistryService } from '../knowledge/tools/registry.service';
import { RAGService } from '../knowledge/rag/rag.service';
import { ToolExecutionService } from '../knowledge/tools/execution.service';

/**
 * Skill Definition
 */
export interface Skill {
  name: string;
  description: string;
  intentPatterns: string[]; // Regex patterns oder Keywords
  toolName?: string; // Tool das für diesen Skill verwendet wird
  ragEnabled?: boolean; // Ob RAG für diesen Skill verwendet werden soll
  priority: number; // Höhere Priorität = wird zuerst geprüft
}

/**
 * Skill Router Service
 */
@Injectable()
export class SkillRouterService {
  private readonly logger = new Logger(SkillRouterService.name);
  private skills: Map<string, Skill> = new Map();

  constructor(
    private readonly toolRegistry: ToolRegistryService,
    private readonly ragService: RAGService,
    private readonly toolExecution: ToolExecutionService,
  ) {
    this.registerDefaultSkills();
  }

  /**
   * Standard-Skills registrieren
   */
  private registerDefaultSkills(): void {
    // Search Skill (RAG-basiert)
    this.registerSkill({
      name: 'search',
      description: 'Suche in Wissensbasis',
      intentPatterns: ['suche', 'finde', 'zeige', 'gib mir informationen', 'was ist', 'wie funktioniert'],
      ragEnabled: true,
      priority: 10,
    });

    // Tool Execution Skill
    this.registerSkill({
      name: 'tool-execution',
      description: 'Tool ausführen',
      intentPatterns: ['führe aus', 'nutze tool', 'verwende'],
      toolName: 'tool-executor',
      priority: 5,
    });

    // General Conversation (Fallback)
    this.registerSkill({
      name: 'conversation',
      description: 'Allgemeine Konversation',
      intentPatterns: ['.*'], // Match alles als Fallback
      ragEnabled: true,
      priority: 1,
    });
  }

  /**
   * Skill registrieren
   */
  registerSkill(skill: Skill): void {
    if (this.skills.has(skill.name)) {
      this.logger.warn(`Skill already registered: ${skill.name}, overwriting...`);
    }

    this.skills.set(skill.name, skill);
    this.logger.log(`Skill registered: ${skill.name}`);
  }

  /**
   * Skill für Message/Intent ermitteln
   */
  detectSkill(message: string, intent?: string): Skill | null {
    const searchText = `${message} ${intent || ''}`.toLowerCase();

    // Skills nach Priorität sortieren
    const sortedSkills = Array.from(this.skills.values()).sort((a, b) => b.priority - a.priority);

    // Ersten passenden Skill finden
    for (const skill of sortedSkills) {
      for (const pattern of skill.intentPatterns) {
        // Einfache Keyword-Matching (kann später zu Regex erweitert werden)
        if (pattern === '.*' || searchText.includes(pattern.toLowerCase())) {
          this.logger.debug(`Skill detected: ${skill.name} for message: ${message.substring(0, 50)}`);
          return skill;
        }
      }
    }

    return null;
  }

  /**
   * Skill ausführen
   */
  async executeSkill(
    skill: Skill,
    input: Record<string, any>,
    sessionId: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    this.logger.debug(`Executing skill: ${skill.name}`, { input, sessionId });

    // RAG-basierter Skill
    if (skill.ragEnabled && input.query) {
      try {
        const ragResponse = await this.ragService.search(input.query, {
          tenantId,
          topK: input.topK || 5,
          knowledgeSpaceId: input.knowledgeSpaceId,
        });
        return {
          skill: skill.name,
          type: 'rag',
          results: ragResponse.results,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`RAG search failed for skill ${skill.name}: ${errorMessage}`);
        throw error;
      }
    }

    // Tool-basierter Skill
    if (skill.toolName) {
      try {
        const tool = this.toolRegistry.getTool(skill.toolName);
        if (!tool) {
          throw new Error(`Tool not found: ${skill.toolName}`);
        }

        const result = await this.toolExecution.executeTool(
          skill.toolName,
          input,
          sessionId,
          tenantId,
          userId,
        );
        return {
          skill: skill.name,
          type: 'tool',
          result,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Tool execution failed for skill ${skill.name}: ${errorMessage}`);
        throw error;
      }
    }

    // Fallback: Skill nicht ausführbar
    throw new Error(`Skill ${skill.name} has no execution method`);
  }

  /**
   * Alle Skills auflisten
   */
  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Skill abrufen
   */
  getSkill(skillName: string): Skill | undefined {
    return this.skills.get(skillName);
  }
}










