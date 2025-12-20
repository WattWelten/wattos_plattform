import { AgentMessage, MemoryContext } from '../interfaces';

/**
 * Memory Configuration
 */
export interface MemoryConfig {
  maxTokens: number;
  compressionThreshold: number; // Token-Limit, ab dem komprimiert wird
  longTermStorage: boolean;
  prismaClient?: {
    agentRun: {
      findUnique: (args: { where: { id: string }; select: { metrics: boolean } }) => Promise<{ metrics?: { memory?: MemoryContext } } | null>;
      update: (args: { where: { id: string }; data: { metrics: { memory: MemoryContext } } }) => Promise<unknown>;
    };
  }; // Optional: Prisma Client für DB-Persistierung
}

/**
 * Memory Manager
 * Verwaltet Conversation History und Long-Term Memory
 */
export class MemoryManager {
  private config: MemoryConfig;
  private memoryStore: Map<string, MemoryContext> = new Map();
  private prisma: MemoryConfig['prismaClient'];

  constructor(config: MemoryConfig) {
    this.config = config;
    this.prisma = config.prismaClient;
  }

  /**
   * Initialisierung
   */
  async initialize(): Promise<void> {
    // Memory-spezifische Initialisierung
  }

  /**
   * Context abrufen
   */
  async getContext(runId: string): Promise<MemoryContext> {
    // Zuerst aus Memory Store prüfen
    let context = this.memoryStore.get(runId);

    if (!context && this.config.longTermStorage && this.prisma) {
      // Aus Datenbank laden
      try {
        const agentRun = await this.prisma.agentRun.findUnique({
          where: { id: runId },
          select: { metrics: true },
        });

        if (agentRun?.metrics?.memory) {
          context = agentRun.metrics.memory as MemoryContext;
          this.memoryStore.set(runId, context);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Note: console.warn is acceptable here as this is not a NestJS service
        console.warn(`Failed to load memory from DB for run ${runId}: ${errorMessage}`);
      }
    }

    if (!context) {
      context = {
        conversationHistory: [],
        longTermFacts: {},
        tokenCount: 0,
        maxTokens: this.config.maxTokens,
      };
      this.memoryStore.set(runId, context);
    }

    return context;
  }

  /**
   * Message hinzufügen
   */
  async addMessage(runId: string, message: AgentMessage): Promise<void> {
    const context = await this.getContext(runId);
    context.conversationHistory.push(message);

    // Token-Count schätzen (ca. 4 Zeichen pro Token)
    const estimatedTokens = Math.ceil(message.content.length / 4);
    context.tokenCount += estimatedTokens;

    // Komprimierung prüfen
    if (context.tokenCount > this.config.compressionThreshold) {
      await this.compressHistory(runId);
    }

    // In DB speichern (wenn aktiviert)
    if (this.config.longTermStorage && this.prisma) {
      await this.persistMemory(runId, context);
    }
  }

  /**
   * Conversation History komprimieren
   */
  async compressHistory(runId: string): Promise<void> {
    const context = await this.getContext(runId);

    if (context.conversationHistory.length === 0) {
      return;
    }

    // Wichtige Fakten extrahieren
    const importantFacts = this.extractImportantFacts(context.conversationHistory);

    // Long-Term Facts aktualisieren
    Object.assign(context.longTermFacts, importantFacts);

    // History auf die letzten N Messages reduzieren
    const keepLastN = 10; // Letzte 10 Messages behalten
    const recentMessages = context.conversationHistory.slice(-keepLastN);

    // Zusammenfassung der älteren Messages erstellen
    const olderMessages = context.conversationHistory.slice(0, -keepLastN);
    if (olderMessages.length > 0) {
      const summary = this.createSummary(olderMessages);
      context.compressedHistory = summary;
    }

    // History aktualisieren
    context.conversationHistory = recentMessages;

    // Token-Count neu berechnen
    context.tokenCount = this.estimateTokenCount(context);
  }

  /**
   * Wichtige Fakten extrahieren
   */
  private extractImportantFacts(messages: AgentMessage[]): Record<string, unknown> {
    const facts: Record<string, unknown> = {};

    // Einfache Heuristik: Suche nach Schlüsselwörtern
    // In einer echten Implementierung würde hier ein LLM verwendet
    messages.forEach((message) => {
      if (message.role === 'user' || message.role === 'assistant') {
        // Beispiel: Extrahiere Namen, Daten, Zahlen
        const nameMatches = message.content.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g);
        if (nameMatches) {
          nameMatches.forEach((name) => {
            if (!facts['names']) {
              facts['names'] = [];
            }
            if (!facts['names'].includes(name)) {
              facts['names'].push(name);
            }
          });
        }
      }
    });

    return facts;
  }

  /**
   * Zusammenfassung erstellen
   */
  private createSummary(messages: AgentMessage[]): string {
    // Einfache Zusammenfassung (in echter Implementierung mit LLM)
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    return `Vorherige Konversation: ${userMessages.length} User-Nachrichten, ${assistantMessages.length} Assistant-Antworten.`;
  }

  /**
   * Token-Count schätzen
   */
  private estimateTokenCount(context: MemoryContext): number {
    let count = 0;

    context.conversationHistory.forEach((message) => {
      count += Math.ceil(message.content.length / 4);
    });

    if (context.compressedHistory) {
      count += Math.ceil(context.compressedHistory.length / 4);
    }

    return count;
  }

  /**
   * Long-Term Fact hinzufügen
   */
  async addLongTermFact(runId: string, key: string, value: unknown): Promise<void> {
    const context = await this.getContext(runId);
    context.longTermFacts[key] = value;
  }

  /**
   * Long-Term Fact abrufen
   */
  async getLongTermFact(runId: string, key: string): Promise<unknown> {
    const context = await this.getContext(runId);
    return context.longTermFacts[key];
  }

  /**
   * Memory in Datenbank persistieren
   */
  private async persistMemory(runId: string, context: MemoryContext): Promise<void> {
    if (!this.prisma || !this.config.longTermStorage) {
      return;
    }

    try {
      // AgentRun aus DB laden
      const agentRun = await this.prisma.agentRun.findUnique({
        where: { id: runId },
        select: { metrics: true },
      });

      if (agentRun) {
        // Metrics aktualisieren mit Memory
        const updatedMetrics = {
          ...(agentRun.metrics || {}),
          memory: context,
        };

        await this.prisma.agentRun.update({
          where: { id: runId },
          data: {
            metrics: updatedMetrics,
          },
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Note: console.warn is acceptable here as this is not a NestJS service
      console.warn(`Failed to persist memory for run ${runId}: ${errorMessage}`);
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    // Memory kann optional persistiert werden
    if (this.config.longTermStorage && this.prisma) {
      // Alle Memory-Kontexte in DB speichern
      for (const [runId, context] of this.memoryStore.entries()) {
        await this.persistMemory(runId, context);
      }
    }

    this.memoryStore.clear();
  }
}
