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
var SlackAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const web_api_1 = require("@slack/web-api");
let SlackAdapter = SlackAdapter_1 = class SlackAdapter {
    configService;
    logger = new common_1.Logger(SlackAdapter_1.name);
    slackClient = null;
    constructor(configService) {
        this.configService = configService;
        this.initializeClient();
    }
    initializeClient() {
        const slackConfig = this.configService.get('adapters.slack');
        if (!slackConfig?.token) {
            this.logger.warn('Slack adapter not configured');
            return;
        }
        this.slackClient = new web_api_1.WebClient(slackConfig.token);
    }
    async execute(request) {
        const startTime = Date.now();
        try {
            if (!this.slackClient) {
                throw new Error('Slack adapter not configured');
            }
            const { channel, text, threadTs } = request.input;
            if (!channel || !text) {
                throw new Error('Channel and text are required');
            }
            const result = await this.slackClient.chat.postMessage({
                channel,
                text,
                thread_ts: threadTs,
            });
            const executionTime = Date.now() - startTime;
            this.logger.log(`Slack message sent: ${result.ts}`);
            return {
                success: true,
                output: {
                    ts: result.ts,
                    channel: result.channel,
                    message: result.message,
                },
                executionTime,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`Slack message send failed: ${error.message}`);
            return {
                success: false,
                error: error.message || 'Slack message send failed',
                executionTime,
            };
        }
    }
    async validateInput(input) {
        if (!input.channel || !input.text) {
            return false;
        }
        if (typeof input.text !== 'string' || input.text.trim().length === 0) {
            return false;
        }
        return true;
    }
    async healthCheck() {
        if (!this.slackClient) {
            return false;
        }
        try {
            await this.slackClient.auth.test();
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.SlackAdapter = SlackAdapter;
exports.SlackAdapter = SlackAdapter = SlackAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SlackAdapter);
//# sourceMappingURL=slack.adapter.js.map