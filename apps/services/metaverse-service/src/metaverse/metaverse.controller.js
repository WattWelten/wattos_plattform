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
exports.MetaverseController = void 0;
const common_1 = require("@nestjs/common");
const metaverse_service_1 = require("./metaverse.service");
let MetaverseController = class MetaverseController {
    service;
    constructor(service) {
        this.service = service;
    }
    async createRoom(name) {
        return this.service.createRoom(name);
    }
    async getRoom(roomId) {
        return this.service.getRoom(roomId);
    }
};
exports.MetaverseController = MetaverseController;
__decorate([
    (0, common_1.Post)('rooms'),
    __param(0, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MetaverseController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MetaverseController.prototype, "getRoom", null);
exports.MetaverseController = MetaverseController = __decorate([
    (0, common_1.Controller)('metaverse'),
    __metadata("design:paramtypes", [metaverse_service_1.MetaverseService])
], MetaverseController);
//# sourceMappingURL=metaverse.controller.js.map