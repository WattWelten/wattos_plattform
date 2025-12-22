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
var JiraAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jira_js_1 = require("jira.js");
let JiraAdapter = JiraAdapter_1 = class JiraAdapter {
    configService;
    logger = new common_1.Logger(JiraAdapter_1.name);
    jiraClient = null;
    constructor(configService) {
        this.configService = configService;
        this.initializeClient();
    }
    initializeClient() {
        const jiraConfig = this.configService.get('adapters.jira');
        if (!jiraConfig?.host || !jiraConfig?.email || !jiraConfig?.apiToken) {
            this.logger.warn('Jira adapter not configured');
            return;
        }
        this.jiraClient = new jira_js_1.JiraApi({
            host: jiraConfig.host,
            authentication: {
                basic: {
                    email: jiraConfig.email,
                    apiToken: jiraConfig.apiToken,
                },
            },
        });
    }
    async execute(request) {
        const startTime = Date.now();
        try {
            if (!this.jiraClient) {
                throw new Error('Jira adapter not configured');
            }
            const { projectKey, summary, description, issueType = 'Task', priority = 'Medium' } = request.input;
            if (!projectKey || !summary || !description) {
                throw new Error('Project key, summary, and description are required');
            }
            const issue = await this.jiraClient.issues.createIssue({
                fields: {
                    project: {
                        key: projectKey,
                    },
                    summary,
                    description: {
                        type: 'doc',
                        version: 1,
                        content: [
                            {
                                type: 'paragraph',
                                content: [
                                    {
                                        type: 'text',
                                        text: description,
                                    },
                                ],
                            },
                        ],
                    },
                    issuetype: {
                        name: issueType,
                    },
                    priority: {
                        name: priority,
                    },
                },
            });
            const executionTime = Date.now() - startTime;
            this.logger.log(`Jira issue created: ${issue.key}`);
            return {
                success: true,
                output: {
                    key: issue.key,
                    id: issue.id,
                    self: issue.self,
                },
                executionTime,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`Jira issue creation failed: ${error.message}`);
            return {
                success: false,
                error: error.message || 'Jira issue creation failed',
                executionTime,
            };
        }
    }
    async validateInput(input) {
        if (!input.projectKey || !input.summary || !input.description) {
            return false;
        }
        const validIssueTypes = ['Bug', 'Task', 'Story', 'Epic'];
        if (input.issueType && !validIssueTypes.includes(input.issueType)) {
            return false;
        }
        const validPriorities = ['Lowest', 'Low', 'Medium', 'High', 'Highest'];
        if (input.priority && !validPriorities.includes(input.priority)) {
            return false;
        }
        return true;
    }
    async healthCheck() {
        if (!this.jiraClient) {
            return false;
        }
        try {
            await this.jiraClient.serverInfo.getServerInfo();
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.JiraAdapter = JiraAdapter;
exports.JiraAdapter = JiraAdapter = JiraAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JiraAdapter);
//# sourceMappingURL=jira.adapter.js.map