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
exports.FeatureFlagsController = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@wattweiser/shared");
const passport_1 = require("@nestjs/passport");
let FeatureFlagsController = class FeatureFlagsController {
    featureFlagService;
    constructor(featureFlagService) {
        this.featureFlagService = featureFlagService;
    }
    async getAllFlags() {
        return this.featureFlagService.getAllFlags();
    }
    async getFlag(key) {
        return this.featureFlagService.getFlag(key);
    }
    async checkFlag(key, userId) {
        const enabled = await this.featureFlagService.isEnabled(key, userId);
        return { enabled };
    }
    async createFlag(flag) {
        await this.featureFlagService.setFlag(flag);
        return flag;
    }
    async updateFlag(key, flag) {
        const existingFlag = await this.featureFlagService.getFlag(key);
        if (!existingFlag) {
            throw new Error(`Feature flag ${key} not found`);
        }
        const updatedFlag = { ...existingFlag, ...flag, key };
        await this.featureFlagService.setFlag(updatedFlag);
        return updatedFlag;
    }
    async deleteFlag(key) {
        await this.featureFlagService.deleteFlag(key);
        return { success: true };
    }
    async emergencyDisable() {
        await this.featureFlagService.emergencyDisable();
        return { success: true };
    }
};
exports.FeatureFlagsController = FeatureFlagsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "getAllFlags", null);
__decorate([
    (0, common_1.Get)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "getFlag", null);
__decorate([
    (0, common_1.Get)(':key/check'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "checkFlag", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "createFlag", null);
__decorate([
    (0, common_1.Put)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "updateFlag", null);
__decorate([
    (0, common_1.Delete)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "deleteFlag", null);
__decorate([
    (0, common_1.Post)('emergency/disable'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeatureFlagsController.prototype, "emergencyDisable", null);
exports.FeatureFlagsController = FeatureFlagsController = __decorate([
    (0, common_1.Controller)('feature-flags'),
    (0, common_1.UseGuards)(passport_1.JwtAuthGuard),
    __metadata("design:paramtypes", [shared_1.FeatureFlagService])
], FeatureFlagsController);
//# sourceMappingURL=feature-flags.controller.js.map