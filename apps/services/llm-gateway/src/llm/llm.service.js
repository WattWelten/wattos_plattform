"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LlmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const provider_factory_1 = require("./services/provider-factory");
const cost_tracking_service_1 = require("./services/cost-tracking.service");
const provider_health_service_1 = require("./services/provider-health.service");
const shared_1 = require("@wattweiser/shared");
const PROVIDER_PRIORITY = ['openai', 'azure', 'anthropic', 'google', 'ollama'];
let LlmService = LlmService_1 = class LlmService {
    providerFactory;
    configService;
    costTrackingService;
    providerHealthService;
    retryService;
    metricsService;
    logger = new common_1.Logger(LlmService_1.name);
    circuitBreakers = new Map();
    constructor(providerFactory, configService, costTrackingService, providerHealthService, retryService, metricsService) {
        this.providerFactory = providerFactory;
        this.configService = configService;
        this.costTrackingService = costTrackingService;
        this.providerHealthService = providerHealthService;
        this.retryService = retryService;
        this.metricsService = metricsService;
        PROVIDER_PRIORITY.forEach(providerName => {
            this.circuitBreakers.set(providerName, new shared_1.CircuitBreakerService(providerName, {
                failureThreshold: 5,
                resetTimeout: 60000,
                halfOpenAttempts: 2,
            }));
        });
    }
    async createChatCompletion(request) {
        const provider = request.provider ?? this.configService.get('defaultProvider') ?? 'openai';
        const response = await this.executeWithFallback(provider, (currentProvider) => currentProvider.createChatCompletion(request));
        await this.costTrackingService.recordUsage({
            provider: response.provider,
            model: response.model,
            tenantId: request.tenantId,
            usage: response.usage,
        });
        return response;
    }
    async createCompletion(request) {
        const provider = request.provider ?? this.configService.get('defaultProvider') ?? 'openai';
        const response = await this.executeWithFallback(provider, async (currentProvider) => {
            if (!currentProvider.createCompletion) {
                throw new Error(`${currentProvider.name} does not support legacy completion endpoint`);
            }
            return currentProvider.createCompletion(request);
        });
        await this.costTrackingService.recordUsage({
            provider: response.provider,
            model: response.model,
            tenantId: request.tenantId,
            usage: response.usage,
        });
        return response;
    }
    async streamChatCompletion(request) {
        const response = await this.createChatCompletion({ ...request, stream: false });
        async function* generator() {
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
    async executeWithFallback(preferredProvider, handler) {
        const providers = this.buildProviderPriority(preferredProvider);
        const errors = [];
        const startTime = Date.now();
        for (const name of providers) {
            const circuitBreaker = this.circuitBreakers.get(name);
            if (!circuitBreaker) {
                this.logger.error(`Circuit breaker not found for provider: ${name}`);
                continue;
            }
            try {
                const provider = this.providerFactory.getProvider(name);
                const response = await this.retryService.executeWithRetry(() => circuitBreaker.execute(name, () => handler(provider)), {
                    maxAttempts: 3,
                    initialDelay: 200,
                    backoffMultiplier: 2,
                    retryableErrors: (error) => {
                        if (error instanceof common_1.ServiceUnavailableException) {
                            return true;
                        }
                        if (error instanceof Error) {
                            return error.message?.includes('network') || error.message?.includes('timeout');
                        }
                        return false;
                    },
                });
                const duration = Date.now() - startTime;
                if (this.metricsService && response.usage) {
                    const cost = this.costTrackingService.calculateCost(response.provider, response.model, response.usage);
                    this.metricsService.recordLlmCall(response.provider, response.model, response.usage.total_tokens, cost, duration);
                }
                return response;
            }
            catch (error) {
                const message = error.message ?? 'Unknown error';
                this.logger.warn(`Provider ${name} failed: ${message}`);
                errors.push({ provider: name, message });
                continue;
            }
        }
        throw new common_1.ServiceUnavailableException(`All providers failed. Errors: ${errors.map((e) => `${e.provider}: ${e.message}`).join(', ')}`);
    }
    buildProviderPriority(preferred) {
        const unique = new Set([preferred.toLowerCase(), ...PROVIDER_PRIORITY]);
        return Array.from(unique);
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = LlmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_factory_1.ProviderFactory,
        config_1.ConfigService,
        cost_tracking_service_1.CostTrackingService,
        provider_health_service_1.ProviderHealthService,
        shared_1.RetryService,
        shared_1.MetricsService])
], LlmService);
//# sourceMappingURL=llm.service.js.map