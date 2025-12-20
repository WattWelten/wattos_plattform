"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAiProvider = void 0;
const base_provider_1 = require("./base.provider");
class AzureOpenAiProvider extends base_provider_1.BaseProvider {
    config;
    constructor(config) {
        super('azure');
        this.config = config;
    }
    buildUrl(path) {
        if (!this.config.endpoint || !this.config.deployment) {
            throw new Error('Azure OpenAI configuration missing endpoint or deployment');
        }
        const version = this.config.apiVersion ?? '2023-12-01-preview';
        return `${this.config.endpoint}/openai/deployments/?api-version=${this.config.apiVersion || '2024-02-15-preview'}`;
    }
    get headers() {
        if (!this.config.apiKey) {
            throw new Error('AZURE_OPENAI_API_KEY is not configured');
        }
        return {
            'api-key': this.config.apiKey,
            'Content-Type': 'application/json',
        };
    }
    async createChatCompletion(request) {
        const url = this.buildUrl('/chat/completions');
        const payload = {
            model: request.model,
            messages: request.messages,
            temperature: request.temperature,
            top_p: request.top_p,
            max_tokens: request.max_tokens,
        };
        const { data } = await this.http.post(url, payload, { headers: this.headers });
        return this.buildResponse({
            id: data.id ?? data.created?.toString(),
            created: data.created ?? Math.floor(Date.now() / 1000),
            model: data.model ?? request.model,
            choices: data.choices?.map((choice) => ({
                index: choice.index,
                message: {
                    role: choice.message?.role ?? 'assistant',
                    content: choice.message?.content ?? '',
                },
                finish_reason: choice.finish_reason ?? null,
            })),
            usage: data.usage ?? {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
        });
    }
}
exports.AzureOpenAiProvider = AzureOpenAiProvider;
//# sourceMappingURL=azure-openai.provider.js.map