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
exports.AvatarController = void 0;
const common_1 = require("@nestjs/common");
const avatar_service_1 = require("./avatar.service");
let AvatarController = class AvatarController {
    avatarService;
    constructor(avatarService) {
        this.avatarService = avatarService;
    }
    async generateAvatar(agentId, body) {
        return this.avatarService.generateAvatar(agentId, body.text, body.voiceId);
    }
    async streamAvatar(agentId) {
        return this.avatarService.streamAvatar(agentId);
    }
    async getAvatarScene(agentId) {
        return this.avatarService.exportAvatarScene(agentId);
    }
    async getAvatarVideo(agentId) {
        return { videoUrl: `/api/v1/avatar/${agentId}/video/stream` };
    }
};
exports.AvatarController = AvatarController;
__decorate([
    (0, common_1.Post)(':agentId/generate'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "generateAvatar", null);
__decorate([
    (0, common_1.Get)(':agentId/stream'),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "streamAvatar", null);
__decorate([
    (0, common_1.Get)(':agentId/scene'),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "getAvatarScene", null);
__decorate([
    (0, common_1.Get)(':agentId/video'),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "getAvatarVideo", null);
exports.AvatarController = AvatarController = __decorate([
    (0, common_1.Controller)('api/v1/avatar'),
    __metadata("design:paramtypes", [avatar_service_1.AvatarService])
], AvatarController);
//# sourceMappingURL=avatar.controller.js.map