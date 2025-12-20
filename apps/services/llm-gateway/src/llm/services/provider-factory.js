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
var ProviderFactory_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_provider_1 = require("../providers/openai.provider");
const azure_openai_provider_1 = require("../providers/azure-openai.provider");
const anthropic_provider_1 = require("../providers/anthropic.provider");
const google_provider_1 = require("../providers/google.provider");
const ollama_provider_1 = require("../providers/ollama.provider");
let ProviderFactory = ProviderFactory_1 = class ProviderFactory {
    configService;
    logger = new common_1.Logger(ProviderFactory_1.name);
    cache = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    getProvider(providerName) {
        const key = providerName.toLowerCase();
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const provider = this.createProvider(key);
        this.cache.set(key, provider);
        return provider;
    }
    createProvider(name) {
        const providersConfig = this.configService.get('providers');
        switch (name) {
            case 'openai':
                return new openai_provider_1.OpenAiProvider(providersConfig.openai);
            case 'azure':
                return new azure_openai_provider_1.AzureOpenAiProvider(providersConfig.azure);
            case 'anthropic':
                return new anthropic_provider_1.AnthropicProvider(providersConfig.anthropic);
            case 'google':
                return new google_provider_1.GoogleProvider(providersConfig.google);
            case 'ollama':
                return new ollama_provider_1.OllamaProvider(providersConfig.ollama);
            default:
                const message = `Unknown provider: ${name}`;
                this.logger.error(message);
                throw new Error(message);
        }
    }
};
exports.ProviderFactory = ProviderFactory;
exports.ProviderFactory = ProviderFactory = ProviderFactory_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProviderFactory);
//# sourceMappingURL=provider-factory.js.map