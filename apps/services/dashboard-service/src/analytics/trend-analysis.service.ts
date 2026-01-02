import { Injectable } from '@nestjs/common';

@Injectable()
export class TrendAnalysisService {
  /**
   * Trend-Analyse durchführen
   */
  analyzeTrend(_data: any[]): any {
    // MVP: Placeholder für Trend-Analysen
    return {
      trend: 'stable',
      change: 0,
    };
  }
}

