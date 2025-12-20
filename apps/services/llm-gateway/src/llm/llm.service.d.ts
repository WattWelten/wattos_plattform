import { ConfigService } from '@nestjs/config';
import { ChatCompletionRequestDto } from './dto/chat-completion-request.dto';
import { CompletionRequestDto } from './dto/completion-request.dto';
import { ChatCompletionResponse, ChatCompletionChunk } from './interfaces/llm-types';
import { ProviderFactory } from './services/provider-factory';
import { CostTrackingService } from './services/cost-tracking.service';
import { ProviderHealthService } from './services/provider-health.service';
import { RetryService, MetricsService } from '@wattweiser/shared';
export declare class LlmService {
    private readonly providerFactory;
    private readonly configService;
    private readonly costTrackingService;
    private readonly providerHealthService;
    private readonly retryService;
    private readonly metricsService?;
    private readonly logger;
    private circuitBreakers;
    constructor(providerFactory: ProviderFactory, configService: ConfigService, costTrackingService: CostTrackingService, providerHealthService: ProviderHealthService, retryService: RetryService, metricsService?: MetricsService | undefined);
    createChatCompletion(request: ChatCompletionRequestDto): Promise<ChatCompletionResponse>;
    createCompletion(request: CompletionRequestDto): Promise<ChatCompletionResponse>;
    streamChatCompletion(request: ChatCompletionRequestDto): Promise<AsyncGenerator<ChatCompletionChunk>>;
    listProviders(): Promise<{
        name: string;
        healthy: boolean;
    }[]>;
    private executeWithFallback;
    private buildProviderPriority;
}
//# sourceMappingURL=llm.service.d.ts.map