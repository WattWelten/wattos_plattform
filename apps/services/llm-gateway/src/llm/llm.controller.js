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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmController = void 0;
const common_1 = require("@nestjs/common");
const chat_completion_request_dto_1 = require("./dto/chat-completion-request.dto");
const completion_request_dto_1 = require("./dto/completion-request.dto");
const llm_service_1 = require("./llm.service");
let LlmController = class LlmController {
    llmService;
    constructor(llmService) {
        this.llmService = llmService;
    }
    async createChatCompletion(body, res) {
        if (body.stream) {
            return this.handleStream(body, res);
        }
        return this.llmService.createChatCompletion(body);
    }
    async createCompletion(body) {
        return this.llmService.createCompletion(body);
    }
    async listProviders() {
        return this.llmService.listProviders();
    }
    async handleStream(request, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const stream = await this.llmService.streamChatCompletion(request);
        try {
            for await (const chunk of stream) {
                res.write('data: ' + JSON.stringify(chunk) + '\n\n');
            }
            res.write('data: [DONE]\n\n');
        }
        catch (error) {
            const payload = { message: error.message };
            res.write('event: error\ndata: ' + JSON.stringify(payload) + '\n\n');
        }
        finally {
            res.end();
        }
    }
};
exports.LlmController = LlmController;
__decorate([
    (0, common_1.Post)('chat/completions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_completion_request_dto_1.ChatCompletionRequestDto, Object]),
    __metadata("design:returntype", Promise)
], LlmController.prototype, "createChatCompletion", null);
__decorate([
    (0, common_1.Post)('completions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [completion_request_dto_1.CompletionRequestDto]),
    __metadata("design:returntype", Promise)
], LlmController.prototype, "createCompletion", null);
__decorate([
    (0, common_1.Get)('providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LlmController.prototype, "listProviders", null);
exports.LlmController = LlmController = __decorate([
    (0, common_1.Controller)({ path: 'v1' }),
    __metadata("design:paramtypes", [llm_service_1.LlmService])
], LlmController);
//# sourceMappingURL=llm.controller.js.map