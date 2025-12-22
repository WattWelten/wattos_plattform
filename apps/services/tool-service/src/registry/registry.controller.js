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
exports.RegistryController = void 0;
const common_1 = require("@nestjs/common");
const registry_service_1 = require("./registry.service");
let RegistryController = class RegistryController {
    registryService;
    constructor(registryService) {
        this.registryService = registryService;
    }
    getAllTools() {
        return this.registryService.getAll();
    }
    getTool(toolId) {
        const tool = this.registryService.get(toolId);
        if (!tool) {
            return { error: `Tool ${toolId} not found` };
        }
        return tool;
    }
    registerTool(tool) {
        this.registryService.register(tool);
        return { success: true, toolId: tool.id };
    }
    unregisterTool(toolId) {
        this.registryService.unregister(toolId);
        return { success: true };
    }
};
exports.RegistryController = RegistryController;
__decorate([
    (0, common_1.Get)('tools'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RegistryController.prototype, "getAllTools", null);
__decorate([
    (0, common_1.Get)('tools/:toolId'),
    __param(0, (0, common_1.Param)('toolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RegistryController.prototype, "getTool", null);
__decorate([
    (0, common_1.Post)('tools'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RegistryController.prototype, "registerTool", null);
__decorate([
    (0, common_1.Delete)('tools/:toolId'),
    __param(0, (0, common_1.Param)('toolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RegistryController.prototype, "unregisterTool", null);
exports.RegistryController = RegistryController = __decorate([
    (0, common_1.Controller)('registry'),
    __metadata("design:paramtypes", [registry_service_1.RegistryService])
], RegistryController);
//# sourceMappingURL=registry.controller.js.map