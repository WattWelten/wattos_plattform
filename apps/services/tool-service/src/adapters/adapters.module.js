"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptersModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const http_adapter_1 = require("./http/http.adapter");
const email_adapter_1 = require("./email/email.adapter");
const jira_adapter_1 = require("./jira/jira.adapter");
const slack_adapter_1 = require("./slack/slack.adapter");
const retrieval_adapter_1 = require("./retrieval/retrieval.adapter");
const adapter_factory_1 = require("./adapter.factory");
let AdaptersModule = class AdaptersModule {
};
exports.AdaptersModule = AdaptersModule;
exports.AdaptersModule = AdaptersModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        providers: [
            http_adapter_1.HttpAdapter,
            email_adapter_1.EmailAdapter,
            jira_adapter_1.JiraAdapter,
            slack_adapter_1.SlackAdapter,
            retrieval_adapter_1.RetrievalAdapter,
            adapter_factory_1.AdapterFactory,
        ],
        exports: [adapter_factory_1.AdapterFactory],
    })
], AdaptersModule);
//# sourceMappingURL=adapters.module.js.map