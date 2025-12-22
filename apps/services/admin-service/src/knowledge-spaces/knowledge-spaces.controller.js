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
exports.KnowledgeSpacesController = void 0;
const common_1 = require("@nestjs/common");
const knowledge_spaces_service_1 = require("./knowledge-spaces.service");
const create_knowledge_space_dto_1 = require("./dto/create-knowledge-space.dto");
const passport_1 = require("@nestjs/passport");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
let KnowledgeSpacesController = class KnowledgeSpacesController {
    knowledgeSpacesService;
    constructor(knowledgeSpacesService) {
        this.knowledgeSpacesService = knowledgeSpacesService;
    }
    async createKnowledgeSpace(dto, tenantId) {
        return this.knowledgeSpacesService.createKnowledgeSpace(dto, tenantId);
    }
    async listKnowledgeSpaces(tenantId) {
        return this.knowledgeSpacesService.listKnowledgeSpaces(tenantId);
    }
    async getKnowledgeSpace(id) {
        return this.knowledgeSpacesService.getKnowledgeSpace(id);
    }
};
exports.KnowledgeSpacesController = KnowledgeSpacesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_knowledge_space_dto_1.CreateKnowledgeSpaceDto, String]),
    __metadata("design:returntype", Promise)
], KnowledgeSpacesController.prototype, "createKnowledgeSpace", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KnowledgeSpacesController.prototype, "listKnowledgeSpaces", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KnowledgeSpacesController.prototype, "getKnowledgeSpace", null);
exports.KnowledgeSpacesController = KnowledgeSpacesController = __decorate([
    (0, common_1.Controller)('knowledge-spaces'),
    (0, common_1.UseGuards)(passport_1.JwtAuthGuard),
    __metadata("design:paramtypes", [knowledge_spaces_service_1.KnowledgeSpacesService])
], KnowledgeSpacesController);
//# sourceMappingURL=knowledge-spaces.controller.js.map