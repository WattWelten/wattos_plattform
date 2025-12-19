import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * Tool Selector Service
 * 
 * Wählt passende Tools für eine Persona aus
 */
@Injectable()
export class ToolSelectorService {
  private readonly logger = new Logger(ToolSelectorService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Tools für eine Persona auswählen
   */
  async selectTools(persona: {
    goals: unknown[];
    painPoints: unknown[];
    characteristics: Record<string, unknown>;
  }): Promise<string[]> {
    // MVP: Einfache Tool-Zuordnung basierend auf Persona-Eigenschaften
    const tools: string[] = [];

    // Standard-Tools für alle Agents
    tools.push('rag-search', 'web-search');

    // Zusätzliche Tools basierend auf Goals und Pain Points
    const goalsStr = JSON.stringify(persona.goals).toLowerCase();
    const painPointsStr = JSON.stringify(persona.painPoints).toLowerCase();

    if (goalsStr.includes('termin') || painPointsStr.includes('termin')) {
      tools.push('calendar');
    }

    if (goalsStr.includes('dokument') || painPointsStr.includes('dokument')) {
      tools.push('document-retrieval');
    }

    if (goalsStr.includes('zahlung') || painPointsStr.includes('zahlung')) {
      tools.push('payment');
    }

    // Duplikate entfernen
    return Array.from(new Set(tools));
  }
}

