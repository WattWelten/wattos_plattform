/**
 * KPI Tracker
 * Sammelt und aggregiert KPIs über mehrere Testläufe
 */

export interface KPIMetrics {
  rag: {
    averagePrecision: number;
    averageRecall: number;
    averageF1Score: number;
    averageResponseTime: number;
    passRate: number;
  };
  agents: {
    firstContactResolutionRate: number; // FCR Rate
    averageResponseTime: number;
    averageCost: number;
    averageToolCalls: number;
    passRate: number;
  };
  overall: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
  };
}

export class KPITracker {
  private ragResults: any[] = [];
  private agentResults: any[] = [];

  /**
   * Add RAG evaluation result
   */
  addRAGResult(result: any): void {
    this.ragResults.push(result);
  }

  /**
   * Add Agent evaluation result
   */
  addAgentResult(result: any): void {
    this.agentResults.push(result);
  }

  /**
   * Calculate aggregated KPIs
   */
  calculateKPIs(): KPIMetrics {
    const ragMetrics = this.calculateRAGMetrics();
    const agentMetrics = this.calculateAgentMetrics();
    const overallMetrics = this.calculateOverallMetrics();

    return {
      rag: ragMetrics,
      agents: agentMetrics,
      overall: overallMetrics,
    };
  }

  private calculateRAGMetrics() {
    if (this.ragResults.length === 0) {
      return {
        averagePrecision: 0,
        averageRecall: 0,
        averageF1Score: 0,
        averageResponseTime: 0,
        passRate: 0,
      };
    }

    const totalPrecision = this.ragResults.reduce(
      (sum, r) => sum + r.metrics.precision,
      0,
    );
    const totalRecall = this.ragResults.reduce((sum, r) => sum + r.metrics.recall, 0);
    const totalF1 = this.ragResults.reduce((sum, r) => sum + r.metrics.f1Score, 0);
    const totalResponseTime = this.ragResults.reduce(
      (sum, r) => sum + r.metrics.responseTime,
      0,
    );
    const passed = this.ragResults.filter((r) => r.passed).length;

    return {
      averagePrecision: totalPrecision / this.ragResults.length,
      averageRecall: totalRecall / this.ragResults.length,
      averageF1Score: totalF1 / this.ragResults.length,
      averageResponseTime: totalResponseTime / this.ragResults.length,
      passRate: passed / this.ragResults.length,
    };
  }

  private calculateAgentMetrics() {
    if (this.agentResults.length === 0) {
      return {
        firstContactResolutionRate: 0,
        averageResponseTime: 0,
        averageCost: 0,
        averageToolCalls: 0,
        passRate: 0,
      };
    }

    const fcrCount = this.agentResults.filter(
      (r) => r.metrics.firstContactResolution,
    ).length;
    const totalResponseTime = this.agentResults.reduce(
      (sum, r) => sum + r.metrics.responseTime,
      0,
    );
    const totalCost = this.agentResults.reduce((sum, r) => sum + r.metrics.cost, 0);
    const totalToolCalls = this.agentResults.reduce(
      (sum, r) => sum + r.metrics.toolCallsCount,
      0,
    );
    const passed = this.agentResults.filter((r) => r.passed).length;

    return {
      firstContactResolutionRate: fcrCount / this.agentResults.length,
      averageResponseTime: totalResponseTime / this.agentResults.length,
      averageCost: totalCost / this.agentResults.length,
      averageToolCalls: totalToolCalls / this.agentResults.length,
      passRate: passed / this.agentResults.length,
    };
  }

  private calculateOverallMetrics() {
    const allResults = [...this.ragResults, ...this.agentResults];
    const totalTests = allResults.length;
    const passedTests = allResults.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;

    return {
      totalTests,
      passedTests,
      failedTests,
      passRate: totalTests > 0 ? passedTests / totalTests : 0,
    };
  }

  /**
   * Reset all tracked results
   */
  reset(): void {
    this.ragResults = [];
    this.agentResults = [];
  }
}

