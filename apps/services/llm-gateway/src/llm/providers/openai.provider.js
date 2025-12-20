"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiProvider = void 0;
const base_provider_1 = require("./base.provider");
class OpenAiProvider extends base_provider_1.BaseProvider {
    config;
    constructor(config) {
        super('openai', config.baseUrl ?? 'https://api.openai.com/v1');
        this.config = config;
    }
    get headers() {
        if (!this.config.apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        return {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
        };
    }
    async createChatCompletion(request) {
        const payload = {
            model: request.model,
            messages: request.messages,
            temperature: request.temperature,
            top_p: request.top_p,
            max_tokens: request.max_tokens,
            stream: false,
        };
        const { data } = await this.http.post('/chat/completions', payload, {
            headers: this.headers,
        });
        return this.buildResponse({
            id: data.id,
            created: data.created,
            model: data.model,
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
    async createCompletion(request) {
        const payload = {
            model: request.model,
            prompt: request.prompt,
            temperature: request.temperature,
            top_p: request.top_p,
            max_tokens: request.max_tokens,
        };
        const { data } = await this.http.post('/completions', payload, {
            headers: this.headers,
        });
        return this.buildResponse({
            id: data.id,
            created: data.created,
            model: data.model,
            choices: data.choices?.map((choice) => ({
                index: choice.index,
                message: {
                    role: 'assistant',
                    content: choice.text ?? '',
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
exports.OpenAiProvider = OpenAiProvider;
//# sourceMappingURL=openai.provider.js.map