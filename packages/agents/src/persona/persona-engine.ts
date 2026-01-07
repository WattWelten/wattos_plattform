import { PersonaConfig, AgentState } from '../interfaces';

/**
 * Persona Engine
 * Generiert System-Prompts basierend auf Persona-Konfiguration
 */
export class PersonaEngine {
  private config: PersonaConfig;
  private systemPromptCache?: string;

  constructor(config: PersonaConfig) {
    this.config = config;
  }

  /**
   * Initialisierung
   */
  async initialize(): Promise<void> {
    // Persona-spezifische Initialisierung (z.B. Template-Laden)
    delete this.systemPromptCache; // Cache invalidieren
  }

  /**
   * System-Prompt generieren
   */
  async generateSystemPrompt(state: AgentState): Promise<string> {
    // Wenn Cache vorhanden und State unverändert, Cache verwenden
    if (this.systemPromptCache) {
      return this.systemPromptCache;
    }

    const parts: string[] = [];

    // Basis-Persona
    parts.push(`Du bist ${this.config.name}, ein ${this.getToneDescription()} Assistent.`);

    // Goal
    if (this.config.goal) {
      parts.push(`\nDein Hauptziel: ${this.config.goal}`);
    }

    // Style
    if (this.config.style) {
      parts.push(`\nDein Kommunikationsstil: ${this.config.style}`);
    }

    // Constraints
    if (this.config.constraints && this.config.constraints.length > 0) {
      parts.push(`\nWichtige Einschränkungen:`);
      this.config.constraints.forEach((constraint, index) => {
        parts.push(`${index + 1}. ${constraint}`);
      });
    }

    // Examples
    if (this.config.examples && this.config.examples.length > 0) {
      parts.push(`\nBeispiele für deine Kommunikation:`);
      this.config.examples.forEach((example, index) => {
        parts.push(`\nBeispiel ${index + 1}:`);
        parts.push(example);
      });
    }

    // Context-Aware Anpassungen
    if (state.memory.longTermFacts && Object.keys(state.memory.longTermFacts).length > 0) {
      parts.push(`\nWichtige Fakten aus vorherigen Konversationen:`);
      Object.entries(state.memory.longTermFacts).forEach(([key, value]) => {
        parts.push(`- ${key}: ${JSON.stringify(value)}`);
      });
    }

    const systemPrompt = parts.join('\n');
    this.systemPromptCache = systemPrompt;

    return systemPrompt;
  }

  /**
   * Tone-Beschreibung
   */
  private getToneDescription(): string {
    const toneMap: Record<string, string> = {
      formal: 'formeller, höflicher',
      casual: 'lockerer, freundlicher',
      friendly: 'freundlicher, einladender',
      professional: 'professioneller, sachlicher',
      technical: 'technischer, präziser',
    };

    return toneMap[this.config.tone] || this.config.tone;
  }

  /**
   * Persona anpassen (für Context-Aware Anpassungen)
   */
  async adaptPersona(_context: Record<string, unknown>): Promise<void> {
    // Persona kann basierend auf Context angepasst werden
    // z.B. bei bestimmten Themen einen anderen Ton verwenden
    delete this.systemPromptCache; // Cache invalidieren
  }

  /**
   * Persona-Config aktualisieren
   */
  updateConfig(config: Partial<PersonaConfig>): void {
    this.config = { ...this.config, ...config };
    delete this.systemPromptCache; // Cache invalidieren
  }
}


