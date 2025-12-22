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
exports.PersonasController = void 0;
const common_1 = require("@nestjs/common");
const personas_service_1 = require("./personas.service");
const refine_persona_dto_1 = require("./dto/refine-persona.dto");
let PersonasController = class PersonasController {
    personasService;
    constructor(personasService) {
        this.personasService = personasService;
    }
    async getPersonasByAnalysis(analysisId) {
        return this.personasService.getPersonasByAnalysis(analysisId);
    }
    async getPersona(id) {
        return this.personasService.getPersona(id);
    }
    async refinePersona(id, dto) {
        return this.personasService.refinePersona(id, dto);
    }
};
exports.PersonasController = PersonasController;
__decorate([
    (0, common_1.Get)(':analysisId/personas'),
    __param(0, (0, common_1.Param)('analysisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonasController.prototype, "getPersonasByAnalysis", null);
__decorate([
    (0, common_1.Get)('personas/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonasController.prototype, "getPersona", null);
__decorate([
    (0, common_1.Post)('personas/:id/refine'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, refine_persona_dto_1.RefinePersonaDto]),
    __metadata("design:returntype", Promise)
], PersonasController.prototype, "refinePersona", null);
exports.PersonasController = PersonasController = __decorate([
    (0, common_1.Controller)('api/v1/analytics'),
    __metadata("design:paramtypes", [personas_service_1.PersonasService])
], PersonasController);
//# sourceMappingURL=personas.controller.js.map