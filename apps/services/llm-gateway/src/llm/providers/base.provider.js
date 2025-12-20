"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
class BaseProvider {
    name;
    http;
    constructor(name, baseURL) {
        this.name = name;
        this.http = axios_1.default.create({
            baseURL,
            timeout: 1000 * 60,
        });
    }
    async *streamChatCompletion(request) {
        const response = await this.createChatCompletion(request);
        yield {
            id: response.id,
            object: 'chat.completion.chunk',
            created: response.created,
            model: response.model,
            choices: response.choices.map((choice) => ({
                index: choice.index,
                delta: { content: choice.message.content, role: choice.message.role },
                finish_reason: choice.finish_reason,
            })),
        };
        yield {
            id: response.id,
            object: 'chat.completion.chunk',
            created: response.created,
            model: response.model,
            choices: response.choices.map((choice) => ({
                index: choice.index,
                delta: {},
                finish_reason: choice.finish_reason ?? 'stop',
            })),
        };
    }
    async healthCheck() {
        try {
            await this.http.get('/');
            return true;
        }
        catch {
            return false;
        }
    }
    buildResponse(partial) {
        return {
            id: partial.id ?? (0, uuid_1.v4)(),
            object: partial.object ?? 'chat.completion',
            created: partial.created ?? Math.floor(Date.now() / 1000),
            model: partial.model ?? 'unknown',
            choices: partial.choices ?? [],
            usage: partial.usage ?? {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
            provider: this.name,
        };
    }
}
exports.BaseProvider = BaseProvider;
//# sourceMappingURL=base.provider.js.map