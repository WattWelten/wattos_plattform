"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleProvider = void 0;
const base_provider_1 = require("./base.provider");
class GoogleProvider extends base_provider_1.BaseProvider {
    config;
    constructor(config) {
        super('google', config.baseUrl);
        this.config = config;
    }
    buildUrl(model) {
        if (!this.config.apiKey) {
            throw new Error('GOOGLE_API_KEY is not configured');
        }
        return `${this.config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'}/models/:generateContent?key=${this.config.apiKey}`;
    }
    async createChatCompletion(request) {
        const url = this.buildUrl(request.model);
        const payload = {
            contents: request.messages.map((message) => ({
                role: message.role,
                parts: [{ text: message.content }],
            })),
            generationConfig: {
                temperature: request.temperature,
                topP: request.top_p,
                maxOutputTokens: request.max_tokens,
            },
        };
        const { data } = await this.http.post(url, payload);
        const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n') ?? '';
        return this.buildResponse({
            id: data?.candidates?.[0]?.id ?? `${Date.now()}`,
            created: Math.floor(Date.now() / 1000),
            model: request.model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: text,
                    },
                    finish_reason: data?.candidates?.[0]?.finishReason ?? null,
                },
            ],
            usage: {
                prompt_tokens: data?.usageMetadata?.promptTokenCount ?? 0,
                completion_tokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
                total_tokens: (data?.usageMetadata?.promptTokenCount ?? 0) +
                    (data?.usageMetadata?.candidatesTokenCount ?? 0),
            },
        });
    }
}
exports.GoogleProvider = GoogleProvider;
//# sourceMappingURL=google.provider.js.map