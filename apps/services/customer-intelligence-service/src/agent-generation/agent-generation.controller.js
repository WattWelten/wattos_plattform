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
exports.AgentGenerationController = void 0;
const common_1 = require("@nestjs/common");
const agent_generation_service_1 = require("./agent-generation.service");
const generate_agents_dto_1 = require("./dto/generate-agents.dto");
let AgentGenerationController = class AgentGenerationController {
    agentGenerationService;
    constructor(agentGenerationService) {
        this.agentGenerationService = agentGenerationService;
    }
    async generateAgents(dto) {
        return this.agentGenerationService.generateAgents(dto);
    }
    async getGeneration(id) {
        return this.agentGenerationService.getGeneration(id);
    }
};
exports.AgentGenerationController = AgentGenerationController;
__decorate([
    (0, common_1.Post)('generate-agents'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_agents_dto_1.GenerateAgentsDto]),
    __metadata("design:returntype", Promise)
], AgentGenerationController.prototype, "generateAgents", null);
__decorate([
    (0, common_1.Get)('generations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentGenerationController.prototype, "getGeneration", null);
exports.AgentGenerationController = AgentGenerationController = __decorate([
    (0, common_1.Controller)('api/v1/analytics'),
    __metadata("design:paramtypes", [agent_generation_service_1.AgentGenerationService])
], AgentGenerationController);
//# sourceMappingURL=agent-generation.controller.js.map