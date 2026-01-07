/**
 * Agent Evaluator
 * Bewertet Agent-Performance anhand von KPIs wie FCR, Zeitersparnis, etc.
 */

export interface AgentTestCase {
  id: string;
  role: string;
  input: string;
  expectedActions?: string[];
  expectedOutput?: string;
  maxCost?: number;
  maxTime?: number; // in seconds
}

export interface AgentEvaluationResult {
  testCaseId: string;
  role: string;
  input: string;
  output?: string;
  actions: string[];
  metrics: {
    firstContactResolution: boolean; // FCR: Problem beim ersten Kontakt gelöst?
    responseTime: number; // in seconds
    cost: number; // in EUR
    toolCallsCount: number;
    accuracy?: number; // Wenn expectedOutput vorhanden
  };
  passed: boolean;
}

export class AgentEvaluator {
  /**
   * Evaluates agent performance
   */
  async evaluate(
    testCase: AgentTestCase,
    output: string,
    actions: string[],
    responseTime: number,
    cost: number,
  ): Promise<AgentEvaluationResult> {
    const firstContactResolution = this.checkFCR(testCase, output, actions);
    const accuracy = testCase.expectedOutput
      ? this.calculateAccuracy(testCase.expectedOutput, output)
      : undefined;

    const passed =
      firstContactResolution &&
      (testCase.maxCost === undefined || cost <= testCase.maxCost) &&
      (testCase.maxTime === undefined || responseTime <= testCase.maxTime) &&
      (accuracy === undefined || accuracy >= 0.8);

    return {
      testCaseId: testCase.id,
      role: testCase.role,
      input: testCase.input,
      output,
      actions,
      metrics: {
        firstContactResolution,
        responseTime,
        cost,
        toolCallsCount: actions.length,
        ...(accuracy !== undefined && { accuracy }),
      },
      passed,
    };
  }

  private checkFCR(_testCase: AgentTestCase, output: string, actions: string[]): boolean {
    // FCR: Problem sollte beim ersten Kontakt gelöst werden
    // Prüft ob Output sinnvoll ist und keine Eskalation nötig war
    const hasEscalation = actions.some((action) =>
      action.toLowerCase().includes('escalate') || action.toLowerCase().includes('human'),
    );
    
    const hasValidOutput = output.length > 50; // Mindestlänge für sinnvolle Antwort
    
    return !hasEscalation && hasValidOutput;
  }

  private calculateAccuracy(expected: string, actual: string): number {
    // Simple similarity based on word overlap
    const expectedWords = new Set(expected.toLowerCase().split(/\s+/));
    const actualWords = new Set(actual.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...expectedWords].filter((x) => actualWords.has(x)));
    const union = new Set([...expectedWords, ...actualWords]);
    
    return intersection.size / union.size;
  }
}

