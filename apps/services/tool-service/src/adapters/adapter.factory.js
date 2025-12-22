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
var AdapterFactory_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterFactory = void 0;
const common_1 = require("@nestjs/common");
const http_adapter_1 = require("./http/http.adapter");
const email_adapter_1 = require("./email/email.adapter");
const jira_adapter_1 = require("./jira/jira.adapter");
const slack_adapter_1 = require("./slack/slack.adapter");
const retrieval_adapter_1 = require("./retrieval/retrieval.adapter");
let AdapterFactory = AdapterFactory_1 = class AdapterFactory {
    httpAdapter;
    emailAdapter;
    jiraAdapter;
    slackAdapter;
    retrievalAdapter;
    logger = new common_1.Logger(AdapterFactory_1.name);
    adapters = new Map();
    constructor(httpAdapter, emailAdapter, jiraAdapter, slackAdapter, retrievalAdapter) {
        this.httpAdapter = httpAdapter;
        this.emailAdapter = emailAdapter;
        this.jiraAdapter = jiraAdapter;
        this.slackAdapter = slackAdapter;
        this.retrievalAdapter = retrievalAdapter;
        this.registerAdapters();
    }
    registerAdapters() {
        this.adapters.set('HttpAdapter', this.httpAdapter);
        this.adapters.set('EmailAdapter', this.emailAdapter);
        this.adapters.set('JiraAdapter', this.jiraAdapter);
        this.adapters.set('SlackAdapter', this.slackAdapter);
        this.adapters.set('RetrievalAdapter', this.retrievalAdapter);
    }
    getAdapter(adapterName) {
        const adapter = this.adapters.get(adapterName);
        if (!adapter) {
            this.logger.warn(`Adapter ${adapterName} not found`);
            return null;
        }
        return adapter;
    }
    getAllAdapters() {
        return this.adapters;
    }
};
exports.AdapterFactory = AdapterFactory;
exports.AdapterFactory = AdapterFactory = AdapterFactory_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [http_adapter_1.HttpAdapter,
        email_adapter_1.EmailAdapter,
        jira_adapter_1.JiraAdapter,
        slack_adapter_1.SlackAdapter,
        retrieval_adapter_1.RetrievalAdapter])
], AdapterFactory);
//# sourceMappingURL=adapter.factory.js.map