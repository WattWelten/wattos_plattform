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
exports.SummaryController = void 0;
const common_1 = require("@nestjs/common");
const summary_service_1 = require("./summary.service");
const create_summary_dto_1 = require("./dto/create-summary.dto");
let SummaryController = class SummaryController {
    summaryService;
    constructor(summaryService) {
        this.summaryService = summaryService;
    }
    async createSummary(dto) {
        return this.summaryService.createSummary(dto);
    }
    async summarizeChat(chatId) {
        return this.summaryService.summarizeChat(chatId);
    }
    async summarizeDocument(documentId) {
        return this.summaryService.summarizeDocument(documentId);
    }
};
exports.SummaryController = SummaryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_summary_dto_1.CreateSummaryDto]),
    __metadata("design:returntype", Promise)
], SummaryController.prototype, "createSummary", null);
__decorate([
    (0, common_1.Get)('chat/:chatId'),
    __param(0, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SummaryController.prototype, "summarizeChat", null);
__decorate([
    (0, common_1.Get)('document/:documentId'),
    __param(0, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SummaryController.prototype, "summarizeDocument", null);
exports.SummaryController = SummaryController = __decorate([
    (0, common_1.Controller)('summary'),
    __metadata("design:paramtypes", [summary_service_1.SummaryService])
], SummaryController);
//# sourceMappingURL=summary.controller.js.map