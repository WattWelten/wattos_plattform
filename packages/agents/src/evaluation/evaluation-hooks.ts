import { EvaluationContext, EvaluationResult, AgentState } from '../interfaces';

/**
 * Evaluation Hooks
 * Pre/Post-Execution, Error-Handling, KPI-Tracking
 */
export class EvaluationHooks {
  private kpiConfig: Record<string, unknown>;
  private kpiMetrics: Map<string, Record<string, unknown>> = new Map();

  constructor(kpiConfig: Record<string, unknown>) {
    this.kpiConfig = kpiConfig;
  }

  /**
   * Initialisierung
   */
  async initialize(): Promise<void> {
    // Evaluation-spezifische Initialisierung
  }

  /**
   * Pre-Execution Hook
   */
  async preExecution(context: EvaluationContext): Promise<EvaluationResult> {
    try {
      // Input-Validierung
      if (!context.state.input || context.state.input.trim().length === 0) {
        return {
          success: false,
          message: 'Input is empty',
        };
      }

      // Agent-Status prüfen
      if (context.state.status !== 'pending' && context.state.status !== 'running') {
        return {
          success: false,
          message: `Agent is in invalid state: ${context.state.status}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Pre-execution validation failed',
      };
    }
  }

  /**
   * Post-Execution Hook
   */
  async postExecution(context: EvaluationContext): Promise<EvaluationResult> {
    try {
      // Output-Validierung
      if (!context.state.output || context.state.output.trim().length === 0) {
        return {
          success: false,
          message: 'Output is empty',
          shouldRetry: true,
        };
      }

      // Metriken sammeln
      const metrics = {
        duration: context.state.metrics.duration,
        tokenUsage: context.state.metrics.tokenUsage,
        costUsd: context.state.metrics.costUsd,
        toolCallsCount: context.state.metrics.toolCallsCount,
      };

      return {
        success: true,
        metrics,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Post-execution validation failed',
      };
    }
  }

  /**
   * Error Hook
   */
  async onError(context: EvaluationContext): Promise<EvaluationResult> {
    try {
      const error = context.state.error || 'Unknown error';

      // Retry-Logik
      const shouldRetry = this.shouldRetry(context.state);

      // Eskalation prüfen
      const shouldEscalate = this.shouldEscalate(context.state);

      return {
        success: false,
        message: error,
        shouldRetry,
        shouldEscalate,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error handling failed',
      };
    }
  }

  /**
   * KPI-Tracking
   */
  async trackKPI(context: EvaluationContext): Promise<void> {
    const agentId = context.agentId;
    const runId = context.runId;
    const state = context.state;

    // KPI-Metriken sammeln
    const kpiMetrics: Record<string, unknown> = {
      duration: state.metrics.duration,
      tokenUsage: state.metrics.tokenUsage,
      costUsd: state.metrics.costUsd,
      toolCallsCount: state.metrics.toolCallsCount,
      status: state.status,
      timestamp: new Date().toISOString(),
    };

    // Agent-spezifische KPIs
    if (this.kpiConfig) {
      Object.keys(this.kpiConfig).forEach((kpiKey) => {
        const kpiValue = this.calculateKPI(kpiKey, state);
        if (kpiValue !== null) {
          kpiMetrics[kpiKey] = kpiValue;
        }
      });
    }

    // Metriken speichern
    const agentMetrics = this.kpiMetrics.get(agentId) || {};
    agentMetrics[runId] = kpiMetrics;
    this.kpiMetrics.set(agentId, agentMetrics);

    // State-Metriken aktualisieren
    state.metrics.kpiMetrics = kpiMetrics;
  }

  /**
   * KPI berechnen
   */
  private calculateKPI(kpiKey: string, state: AgentState): number | null {
    const kpiConfig = this.kpiConfig[kpiKey];

    if (!kpiConfig) {
      return null;
    }

    switch (kpiKey) {
      case 'fcr_rate': {
        // First Contact Resolution Rate
        // Annahme: Wenn kein Tool-Call für Eskalation, dann FCR
        const escalated = state.toolCalls.some((tc) => tc.toolName === 'escalate');
        return escalated ? 0 : 1;
      }

      case 'lead_time':
        // Lead Time in Minuten
        return state.metrics.duration ? state.metrics.duration / 1000 / 60 : null;

      case 'cost_per_run':
        // Kosten pro Run
        return state.metrics.costUsd;

      case 'tool_efficiency':
        // Tool-Effizienz (Output-Länge / Tool-Calls)
        if (state.metrics.toolCallsCount === 0) {
          return null;
        }
        return state.output ? state.output.length / state.metrics.toolCallsCount : null;

      default:
        return null;
    }
  }

  /**
   * Retry-Entscheidung
   */
  private shouldRetry(state: AgentState): boolean {
    // Retry bei transienten Fehlern
    const retryableErrors = ['timeout', 'rate_limit', 'network_error', 'temporary_failure'];

    if (!state.error) {
      return false;
    }

    const errorLower = state.error.toLowerCase();
    return retryableErrors.some((retryableError) => errorLower.includes(retryableError));
  }

  /**
   * Eskalations-Entscheidung
   */
  private shouldEscalate(state: AgentState): boolean {
    // Eskalation bei kritischen Fehlern oder mehreren Retries
    if (state.metrics.retryCount >= 3) {
      return true;
    }

    const criticalErrors = ['security', 'compliance', 'data_loss', 'unauthorized'];

    if (!state.error) {
      return false;
    }

    const errorLower = state.error.toLowerCase();
    return criticalErrors.some((criticalError) => errorLower.includes(criticalError));
  }

  /**
   * KPI-Metriken abrufen
   */
  getKPIMetrics(agentId: string): Record<string, unknown> {
    return this.kpiMetrics.get(agentId) || {};
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    // Metriken können optional persistiert werden
    this.kpiMetrics.clear();
  }
}


