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
var ToolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolService = void 0;
const common_1 = require("@nestjs/common");
const registry_service_1 = require("../registry/registry.service");
const adapter_factory_1 = require("../adapters/adapter.factory");
const execution_service_1 = require("../execution/execution.service");
let ToolService = ToolService_1 = class ToolService {
    registryService;
    adapterFactory;
    executionService;
    logger = new common_1.Logger(ToolService_1.name);
    constructor(registryService, adapterFactory, executionService) {
        this.registryService = registryService;
        this.adapterFactory = adapterFactory;
        this.executionService = executionService;
    }
    async executeTool(request) {
        try {
            const tool = this.registryService.get(request.toolId);
            if (!tool) {
                throw new common_1.NotFoundException(`Tool ${request.toolId} not found`);
            }
            const adapter = this.adapterFactory.getAdapter(tool.adapter);
            if (!adapter) {
                throw new Error(`Adapter ${tool.adapter} not found`);
            }
            const isValid = await adapter.validateInput(request.input);
            if (!isValid) {
                return {
                    success: false,
                    error: 'Invalid input',
                    executionTime: 0,
                };
            }
            const result = await this.executionService.execute(request, tool, adapter);
            return result;
        }
        catch (error) {
            this.logger.error(`Tool execution failed: ${error.message}`);
            return {
                success: false,
                error: error.message || 'Tool execution failed',
                executionTime: 0,
            };
        }
    }
    async healthCheck(toolId) {
        try {
            const tool = this.registryService.get(toolId);
            if (!tool) {
                return false;
            }
            const adapter = this.adapterFactory.getAdapter(tool.adapter);
            if (!adapter) {
                return false;
            }
            return await adapter.healthCheck();
        }
        catch {
            return false;
        }
    }
};
exports.ToolService = ToolService;
exports.ToolService = ToolService = ToolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [registry_service_1.RegistryService,
        adapter_factory_1.AdapterFactory,
        execution_service_1.ExecutionService])
], ToolService);
//# sourceMappingURL=tool.service.js.map