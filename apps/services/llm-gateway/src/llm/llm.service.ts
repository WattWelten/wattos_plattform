import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatCompletionRequestDto } from './dto/chat-completion-request.dto';
import { CompletionRequestDto } from './dto/completion-request.dto';
import { LlmProvider } from './interfaces/llm-provider.interface';
import { ChatCompletionResponse, ChatCompletionChunk } from './interfaces/llm-types';
import { ProviderFactory } from './services/provider-factory';
import { CostTrackingService } from './services/cost-tracking.service';
import { ProviderHealthService } from './services/provider-health.service';
import { CircuitBreakerService, RetryService, MetricsService } from '@wattweiser/shared';

interface RecordUsageInput {
  provider: string;
  model: string;
  tenantId?: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

const PROVIDER_PRIORITY = ['openai', 'azure', 'anthropic', 'google', 'ollama'];

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly circuitBreaker: CircuitBreakerService;

  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly configService: ConfigService,
    private readonly costTrackingService: CostTrackingService,
    private readonly providerHealthService: ProviderHealthService,
    private readonly retryService: RetryService,
    circuitBreaker: CircuitBreakerService,
    private readonly metricsService?: MetricsService,
  ) {
    this.circuitBreaker = circuitBreaker;
  }

  async createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse> {
    const provider = request.provider ?? this.configService.get<string>('defaultProvider') ?? 'openai';
    const response = await this.executeWithFallback(provider, (currentProvider) =>
      currentProvider.createChatCompletion(request),
    );
    const usageInput: RecordUsageInput = {
      provider: response.provider,
      model: response.model,
      usage: response.usage,
    };
    if (request.tenantId !== undefined) {
      usageInput.tenantId = request.tenantId;
    }
    await this.costTrackingService.recordUsage(usageInput);
    return response;
  }

  async createCompletion(request: CompletionRequestDto): Promise<ChatCompletionResponse> {
    const provider = request.provider ?? this.configService.get<string>('defaultProvider') ?? 'openai';
    const response = await this.executeWithFallback(provider, async (currentProvider) => {
      if (!currentProvider.createCompletion) {
        throw new Error(`${currentProvider.name} does not support legacy completion endpoint`);
      }
      return currentProvider.createCompletion(request);
    });
    const usageInput: RecordUsageInput = {
      provider: response.provider,
      model: response.model,
      usage: response.usage,
    };
    if (request.tenantId !== undefined) {
      usageInput.tenantId = request.tenantId;
    }
    await this.costTrackingService.recordUsage(usageInput);
    return response;
  }

  async streamChatCompletion(request: ChatCompletionRequestDto): Promise<AsyncGenerator<ChatCompletionChunk>> {
    const response = await this.createChatCompletion({ ...request, stream: false });
    async function* generator(): AsyncGenerator<ChatCompletionChunk> {
      for (const choice of response.choices) {
        yield {
          id: response.id,
          object: 'chat.completion.chunk',
          created: response.created,
          model: response.model,
          choices: [
            {
              index: choice.index,
              delta: {
                role: choice.message.role,
                content: choice.message.content,
              },
              finish_reason: choice.finish_reason,
            },
          ],
        };
      }
      yield {
        id: response.id,
        object: 'chat.completion.chunk',
        created: response.created,
        model: response.model,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
      };
    }
    return generator();
  }

  async listProviders() {
    const statuses = await this.providerHealthService.collectStatuses(PROVIDER_PRIORITY);
    return statuses;
  }

  private async executeWithFallback(
    preferredProvider: string,
    handler: (provider: LlmProvider) => Promise<ChatCompletionResponse>,
  ): Promise<ChatCompletionResponse> {
    const providers = this.buildProviderPriority(preferredProvider);
    const errors: Array<{ provider: string; message: string }> = [];
    const startTime = Date.now();

    for (const name of providers) {
      try {
        const provider = this.providerFactory.getProvider(name);
        
        // Execute with circuit breaker and retry
        const response = await this.retryService.executeWithRetry(
          () => this.circuitBreaker.execute<ChatCompletionResponse>(name, () => handler(provider), {
            failureThreshold: 5,
            resetTimeout: 60000,
            monitoringPeriod: 60000,
          }),
          {
            maxAttempts: 3,
            initialDelay: 200,
            backoffMultiplier: 2,
            retryableErrors: (error: unknown) => {
              // Only retry on transient errors
              if (error instanceof ServiceUnavailableException) {
                return true;
              }
              if (error instanceof Error) {
                return error.message?.includes('network') || error.message?.includes('timeout');
              }
              return false;
            },
          }
        );

        // Track metrics
        const duration = Date.now() - startTime;
        if (this.metricsService && response.usage) {
          const cost = this.costTrackingService.calculateCost(response.provider, response.model, response.usage);
          this.metricsService.recordLlmCall(
            response.provider,
            response.model,
            response.usage.total_tokens,
            cost,
            duration
          );
        }

        return response;
      } catch (error) {
        const message = (error as Error).message ?? 'Unknown error';
        this.logger.warn(`Provider ${name} failed: ${message}`);
        errors.push({ provider: name, message });
        continue;
      }
    }

    throw new ServiceUnavailableException(
      `All providers failed. Errors: ${errors.map((e) => `${e.provider}: ${e.message}`).join(', ')}`,
    );
  }

  private buildProviderPriority(preferred: string) {
    const unique = new Set<string>([preferred.toLowerCase(), ...PROVIDER_PRIORITY]);
    return Array.from(unique);
  }
}