/**
 * RAG Evaluator
 * Bewertet RAG-Systeme anhand von Metriken wie Relevanz, Genauigkeit, etc.
 */

export interface RAGTestCase {
  id: string;
  query: string;
  expectedContext: string[];
  expectedAnswer?: string;
  knowledgeSpaceId: string;
}

export interface RAGEvaluationResult {
  testCaseId: string;
  query: string;
  retrievedContext: string[];
  answer?: string;
  metrics: {
    precision: number; // Relevanz der abgerufenen Dokumente
    recall: number; // Vollständigkeit der Abfrage
    f1Score: number; // Harmonisches Mittel aus Precision und Recall
    answerAccuracy?: number; // Wenn expectedAnswer vorhanden
    responseTime: number; // in ms
  };
  passed: boolean;
}

export class RAGEvaluator {
  /**
   * Evaluates RAG retrieval performance
   */
  async evaluateRetrieval(
    testCase: RAGTestCase,
    retrievedContext: string[],
    responseTime: number,
  ): Promise<RAGEvaluationResult> {
    const precision = this.calculatePrecision(testCase.expectedContext, retrievedContext);
    const recall = this.calculateRecall(testCase.expectedContext, retrievedContext);
    const f1Score = this.calculateF1Score(precision, recall);

    return {
      testCaseId: testCase.id,
      query: testCase.query,
      retrievedContext,
      metrics: {
        precision,
        recall,
        f1Score,
        responseTime,
      },
      passed: f1Score >= 0.7, // Threshold: 70% F1-Score
    };
  }

  /**
   * Evaluates RAG answer quality (if expected answer provided)
   */
  async evaluateAnswer(
    testCase: RAGTestCase,
    answer: string,
    retrievedContext: string[],
    responseTime: number,
  ): Promise<RAGEvaluationResult> {
    const precision = this.calculatePrecision(testCase.expectedContext, retrievedContext);
    const recall = this.calculateRecall(testCase.expectedContext, retrievedContext);
    const f1Score = this.calculateF1Score(precision, recall);
    
    let answerAccuracy: number | undefined;
    if (testCase.expectedAnswer) {
      answerAccuracy = this.calculateAnswerAccuracy(testCase.expectedAnswer, answer);
    }

    return {
      testCaseId: testCase.id,
      query: testCase.query,
      retrievedContext,
      answer,
      metrics: {
        precision,
        recall,
        f1Score,
        answerAccuracy,
        responseTime,
      },
      passed: f1Score >= 0.7 && (answerAccuracy === undefined || answerAccuracy >= 0.8),
    };
  }

  private calculatePrecision(expected: string[], retrieved: string[]): number {
    if (retrieved.length === 0) return 0;
    const relevantRetrieved = retrieved.filter((item) =>
      expected.some((exp) => this.similarity(exp, item) > 0.7),
    );
    return relevantRetrieved.length / retrieved.length;
  }

  private calculateRecall(expected: string[], retrieved: string[]): number {
    if (expected.length === 0) return 1;
    const foundExpected = expected.filter((exp) =>
      retrieved.some((ret) => this.similarity(exp, ret) > 0.7),
    );
    return foundExpected.length / expected.length;
  }

  private calculateF1Score(precision: number, recall: number): number {
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
  }

  private calculateAnswerAccuracy(expected: string, actual: string): number {
    // Simple similarity based on word overlap
    const expectedWords = new Set(expected.toLowerCase().split(/\s+/));
    const actualWords = new Set(actual.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...expectedWords].filter((x) => actualWords.has(x)));
    const union = new Set([...expectedWords, ...actualWords]);
    
    return intersection.size / union.size;
  }

  private similarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

