"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RegistryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryService = void 0;
const common_1 = require("@nestjs/common");
let RegistryService = RegistryService_1 = class RegistryService {
    logger = new common_1.Logger(RegistryService_1.name);
    tools = new Map();
    async onModuleInit() {
        this.registerDefaultTools();
    }
    register(tool) {
        if (this.tools.has(tool.id)) {
            this.logger.warn(`Tool ${tool.id} already registered, overwriting...`);
        }
        this.tools.set(tool.id, tool);
        this.logger.log(`Tool registered: ${tool.name} (${tool.id})`);
    }
    get(toolId) {
        return this.tools.get(toolId) || null;
    }
    getAll() {
        return Array.from(this.tools.values());
    }
    unregister(toolId) {
        const tool = this.tools.get(toolId);
        if (tool) {
            this.tools.delete(toolId);
            this.logger.log(`Tool unregistered: ${tool.name} (${toolId})`);
        }
    }
    registerDefaultTools() {
        this.register({
            id: 'http_request',
            name: 'HTTP Request',
            description: 'Führt HTTP-Requests aus (GET, POST, PUT, DELETE)',
            type: 'http',
            schema: {
                type: 'object',
                properties: {
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                        description: 'HTTP-Methode',
                    },
                    url: {
                        type: 'string',
                        description: 'URL für den Request',
                    },
                    headers: {
                        type: 'object',
                        description: 'HTTP-Headers',
                    },
                    body: {
                        type: 'object',
                        description: 'Request-Body (für POST/PUT)',
                    },
                },
                required: ['method', 'url'],
            },
            adapter: 'HttpAdapter',
            timeout: 30000,
            retryCount: 3,
        });
        this.register({
            id: 'send_email',
            name: 'Send Email',
            description: 'Sendet eine E-Mail',
            type: 'email',
            schema: {
                type: 'object',
                properties: {
                    to: {
                        type: 'string',
                        description: 'E-Mail-Adresse des Empfängers',
                    },
                    subject: {
                        type: 'string',
                        description: 'Betreff der E-Mail',
                    },
                    body: {
                        type: 'string',
                        description: 'E-Mail-Text',
                    },
                    cc: {
                        type: 'array',
                        description: 'CC-Empfänger',
                    },
                    bcc: {
                        type: 'array',
                        description: 'BCC-Empfänger',
                    },
                },
                required: ['to', 'subject', 'body'],
            },
            adapter: 'EmailAdapter',
            requiresApproval: true,
            timeout: 10000,
        });
        this.register({
            id: 'jira_create_issue',
            name: 'Jira Create Issue',
            description: 'Erstellt ein Jira-Ticket',
            type: 'jira',
            schema: {
                type: 'object',
                properties: {
                    projectKey: {
                        type: 'string',
                        description: 'Jira-Projekt-Key',
                    },
                    summary: {
                        type: 'string',
                        description: 'Zusammenfassung des Tickets',
                    },
                    description: {
                        type: 'string',
                        description: 'Beschreibung des Tickets',
                    },
                    issueType: {
                        type: 'string',
                        enum: ['Bug', 'Task', 'Story', 'Epic'],
                        description: 'Typ des Tickets',
                    },
                    priority: {
                        type: 'string',
                        enum: ['Lowest', 'Low', 'Medium', 'High', 'Highest'],
                        description: 'Priorität des Tickets',
                    },
                },
                required: ['projectKey', 'summary', 'description'],
            },
            adapter: 'JiraAdapter',
            requiresApproval: true,
            timeout: 15000,
        });
        this.register({
            id: 'slack_send_message',
            name: 'Slack Send Message',
            description: 'Sendet eine Nachricht in einen Slack-Kanal',
            type: 'slack',
            schema: {
                type: 'object',
                properties: {
                    channel: {
                        type: 'string',
                        description: 'Slack-Kanal-ID oder Name',
                    },
                    text: {
                        type: 'string',
                        description: 'Nachrichtentext',
                    },
                    threadTs: {
                        type: 'string',
                        description: 'Thread-Timestamp (für Antworten)',
                    },
                },
                required: ['channel', 'text'],
            },
            adapter: 'SlackAdapter',
            requiresApproval: false,
            timeout: 10000,
        });
        this.register({
            id: 'retrieval_search',
            name: 'Retrieval Search',
            description: 'Durchsucht einen Wissensraum mit RAG',
            type: 'retrieval',
            schema: {
                type: 'object',
                properties: {
                    knowledgeSpaceId: {
                        type: 'string',
                        description: 'ID des Wissensraums',
                    },
                    query: {
                        type: 'string',
                        description: 'Suchanfrage',
                    },
                    topK: {
                        type: 'number',
                        description: 'Anzahl der Ergebnisse',
                        default: 5,
                    },
                },
                required: ['knowledgeSpaceId', 'query'],
            },
            adapter: 'RetrievalAdapter',
            timeout: 5000,
        });
    }
};
exports.RegistryService = RegistryService;
exports.RegistryService = RegistryService = RegistryService_1 = __decorate([
    (0, common_1.Injectable)()
], RegistryService);
//# sourceMappingURL=registry.service.js.map