import { BaseAgent, AgentConfig, AgentState } from '../core/base-agent';

/**
 * IT Support Agent
 * Spezialisierter Agent für IT-Support-Aufgaben
 */
export class ITSupportAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  /**
   * Agent-spezifische Initialisierung
   */
  protected async onInitialize(): Promise<void> {
    // IT-Support-spezifische Initialisierung
    // Zusätzliche Tools, Konfigurationen, etc.
  }

  /**
   * Agent-spezifische Ausführung
   */
  protected async execute(state: AgentState): Promise<string> {
    // IT-Support-spezifische Logik
    // Für jetzt: Standard-Implementierung über LLM
    // Kann später erweitert werden mit spezifischen IT-Support-Flows
    const systemPrompt = `Du bist ein IT-Support-Assistent. 
Hilf bei IT-Fragen, Problemen und Support-Anfragen.
Sei professionell, hilfsbereit und technisch präzise.
Gib strukturierte, Schritt-für-Schritt-Anleitungen.`;

    // Die eigentliche Ausführung erfolgt über BaseAgent.run()
    // Diese Methode wird von BaseAgent aufgerufen
    // Für jetzt: Standard-LLM-Aufruf
    return state.output || '';
  }

  /**
   * Cleanup
   */
  protected async onCleanup(): Promise<void> {
    // IT-Support-spezifisches Cleanup
  }
}

