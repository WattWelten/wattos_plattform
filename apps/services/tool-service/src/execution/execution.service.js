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
var ExecutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ExecutionService = ExecutionService_1 = class ExecutionService {
    configService;
    logger = new common_1.Logger(ExecutionService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async execute(request, tool, adapter) {
        const startTime = Date.now();
        const timeout = tool.timeout || this.configService.get('sandbox.timeout') || 30000;
        try {
            const result = await Promise.race([
                adapter.execute(request),
                this.createTimeout(timeout),
            ]);
            if (result === 'timeout') {
                return {
                    success: false,
                    error: `Tool execution timed out after ${timeout}ms`,
                    executionTime: Date.now() - startTime,
                };
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Tool execution error: ${error.message}`);
            return {
                success: false,
                error: error.message || 'Tool execution failed',
                executionTime: Date.now() - startTime,
            };
        }
    }
    createTimeout(ms) {
        return new Promise((resolve) => {
            setTimeout(() => resolve('timeout'), ms);
        });
    }
};
exports.ExecutionService = ExecutionService;
exports.ExecutionService = ExecutionService = ExecutionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ExecutionService);
//# sourceMappingURL=execution.service.js.map