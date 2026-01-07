import { PolicyConfig, Guardrail, ApprovalWorkflow } from '../interfaces';

/**
 * Policy Validation Result
 */
export interface PolicyValidationResult {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  approvalWorkflowId?: string;
}

/**
 * Policy Enforcer
 * Enforced Guardrails, PII-Redaction, Approval-Workflows
 */
export class PolicyEnforcer {
  private config: PolicyConfig;
  private piiPatterns: RegExp[] = [];

  constructor(config: PolicyConfig) {
    this.config = config;
    this.initializePiiPatterns();
  }

  /**
   * Initialisierung
   */
  async initialize(): Promise<void> {
    // Policy-spezifische Initialisierung
  }

  /**
   * PII-Patterns initialisieren
   */
  private initializePiiPatterns(): void {
    // E-Mail
    this.piiPatterns.push(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);

    // Telefonnummer (DE-Format)
    this.piiPatterns.push(/\b(\+49|0)[1-9]\d{1,14}\b/g);

    // IBAN
    this.piiPatterns.push(/\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g);

    // Kreditkarte
    this.piiPatterns.push(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g);
  }

  /**
   * Input validieren
   */
  async validateInput(input: string): Promise<PolicyValidationResult> {
    // PII-Redaction prüfen
    if (this.config.piiRedaction) {
      const piiDetected = this.detectPii(input);
      if (piiDetected.detected) {
        return {
          allowed: false,
          reason: `PII detected: ${piiDetected.types.join(', ')}. Input must be redacted.`,
        };
      }
    }

    // Guardrails prüfen
    for (const guardrail of this.config.guardrails) {
      const result = await this.checkGuardrail(guardrail, input);
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true };
  }

  /**
   * Tool Call validieren
   */
  async validateToolCall(
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<PolicyValidationResult> {
    // Guardrails für Tool-Calls prüfen
    for (const guardrail of this.config.guardrails) {
      // Prüfe ob Guardrail für dieses Tool gilt
      if (guardrail.condition.includes('toolName')) {
        const result = await this.checkGuardrail(guardrail, JSON.stringify(input), toolName);
        if (!result.allowed) {
          return result;
        }
      }
    }

    // Approval-Workflow prüfen
    const approvalWorkflow = this.findApprovalWorkflow(toolName, input);
    if (approvalWorkflow) {
      return {
        allowed: true,
        requiresApproval: true,
        approvalWorkflowId: approvalWorkflow.id,
      };
    }

    return { allowed: true };
  }

  /**
   * Guardrail prüfen
   */
  private async checkGuardrail(
    guardrail: Guardrail,
    input: string,
    toolName?: string,
  ): Promise<PolicyValidationResult> {
    // Einfache Condition-Evaluierung (in echter Implementierung mit sicherer Evaluierung)
    let conditionMet = false;

    try {
      // Beispiel: "toolName === 'admin_command'"
      if (guardrail.condition.includes('toolName')) {
        conditionMet = toolName === guardrail.condition.split("'")[1];
      } else {
        // Andere Conditions (z.B. Keyword-Detection)
        conditionMet = input.toLowerCase().includes(guardrail.condition.toLowerCase());
      }
    } catch (_error) {
      // Bei Fehler: Guardrail nicht erfüllt (sicherer Fall)
      conditionMet = false;
    }

    if (!conditionMet) {
      return { allowed: true };
    }

    // Guardrail-Action ausführen
    switch (guardrail.action) {
      case 'block':
        return {
          allowed: false,
          reason: guardrail.message || `Action blocked by guardrail: ${guardrail.name}`,
        };

      case 'require_approval':
        return {
          allowed: true,
          requiresApproval: true,
          reason: guardrail.message || `Approval required for: ${guardrail.name}`,
        };

      case 'warn':
        // Warnung loggen, aber erlauben
        // Note: console.warn is acceptable here as this is not a NestJS service
        console.warn(`Guardrail warning: ${guardrail.name} - ${guardrail.message}`);
        return { allowed: true };

      case 'log':
        // Nur loggen
        // Note: console.warn is acceptable here as this is not a NestJS service
        console.warn(`Guardrail log: ${guardrail.name} - ${guardrail.message}`);
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }

  /**
   * Approval-Workflow finden
   */
  private findApprovalWorkflow(
    toolName: string,
    input: Record<string, unknown>,
  ): ApprovalWorkflow | null {
    for (const workflow of this.config.approvalWorkflows) {
      // Einfache Trigger-Evaluierung
      if (workflow.trigger.includes('toolName')) {
        const expectedToolName = workflow.trigger.split("'")[1];
        if (toolName === expectedToolName) {
          return workflow;
        }
      }

      // Cost-basierte Triggers (z.B. "cost > 10")
      if (workflow.trigger.includes('cost')) {
        const costValue = input.cost;
        const cost = typeof costValue === 'number' ? costValue : typeof costValue === 'string' ? parseFloat(costValue) : 0;
        const threshold = parseFloat(workflow.trigger.match(/\d+/)?.[0] || '0');
        if (cost > threshold) {
          return workflow;
        }
      }
    }

    return null;
  }

  /**
   * PII erkennen
   */
  detectPii(text: string): { detected: boolean; types: string[] } {
    const types: string[] = [];

    this.piiPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        const typeNames = ['email', 'phone', 'iban', 'credit_card'];
        types.push(typeNames[index] || `pattern_${index}`);
      }
    });

    return {
      detected: types.length > 0,
      types,
    };
  }

  /**
   * PII redactieren
   */
  redactPii(text: string): string {
    let redacted = text;

    this.piiPatterns.forEach((pattern) => {
      redacted = redacted.replace(pattern, '[REDACTED]');
    });

    return redacted;
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    // Policy-spezifisches Cleanup
  }
}

