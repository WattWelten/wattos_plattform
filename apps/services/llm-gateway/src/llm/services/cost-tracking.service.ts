import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

interface RecordUsageInput {
  tenantId?: string;
  provider: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEFAULT_RATES = {
  prompt: 0.000002,
  completion: 0.000004,
};

const MODEL_RATES: Record<string, { prompt: number; completion: number }> = {
  'gpt-4': { prompt: 0.00003, completion: 0.00006 },
  'gpt-4-1106-preview': { prompt: 0.00001, completion: 0.00003 },
  'gpt-3.5-turbo': { prompt: 0.000001, completion: 0.000002 },
  'gpt-4-turbo': { prompt: 0.00001, completion: 0.00003 },
  'gpt-4o': { prompt: 0.000005, completion: 0.000015 },
  'claude-3-opus': { prompt: 0.000015, completion: 0.000075 },
  'claude-3-sonnet': { prompt: 0.000003, completion: 0.000015 },
  'claude-3-haiku': { prompt: 0.00000025, completion: 0.00000125 },
  'gemini-pro': { prompt: 0.0000005, completion: 0.0000015 },
};

@Injectable()
export class CostTrackingService {
  private readonly logger = new Logger(CostTrackingService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Berechnet die Kosten für einen LLM-Aufruf ohne sie zu speichern
   */
  calculateCost(provider: string, model: string, usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }): number {
    const rates = MODEL_RATES[model] ?? DEFAULT_RATES;
    return (usage.prompt_tokens * rates.prompt + usage.completion_tokens * rates.completion) / 1000;
  }

  async recordUsage(input: RecordUsageInput) {
    try {
      const costUsd = this.calculateCost(input.provider, input.model, input.usage);

      const logMessage =
        'Cost | tenant=' +
        (input.tenantId ?? 'n/a') +
        ' provider=' +
        input.provider +
        ' model=' +
        input.model +
        ' cost=$' +
        costUsd.toFixed(6);
      this.logger.debug(logMessage);

      // In Datenbank persistieren
      if (input.tenantId) {
        await this.prisma.lLMUsage.create({
          data: {
            tenantId: input.tenantId,
            provider: input.provider,
            model: input.model,
            promptTokens: input.usage.prompt_tokens,
            completionTokens: input.usage.completion_tokens,
            totalTokens: input.usage.total_tokens,
            costUsd: costUsd,
          },
        });
        this.logger.log(`LLM usage recorded for tenant ${input.tenantId}`);
      } else {
        this.logger.warn('No tenantId provided, skipping database persistence');
      }

      return {
        ...input.usage,
        costUsd,
      };
    } catch (error: any) {
      this.logger.error(`Failed to record LLM usage: ${error.message}`);
      // Nicht werfen, damit der LLM-Aufruf nicht fehlschlägt
      return {
        ...input.usage,
        costUsd: 0,
      };
    }
  }

  /**
   * Kosten für einen Tenant abrufen
   */
  async getCostsForTenant(tenantId: string, startDate?: Date, endDate?: Date) {
    try {
      const where: any = { tenantId };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const usage = await this.prisma.lLMUsage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const totalCost = usage.reduce((sum, u) => sum + Number(u.costUsd), 0);
      const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0);

      return {
        totalCost,
        totalTokens,
        usageCount: usage.length,
        usage,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get costs for tenant: ${error.message}`);
      throw error;
    }
  }
}
