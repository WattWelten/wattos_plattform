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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAnalysisDto = exports.AnalysisType = exports.CustomerType = void 0;
const class_validator_1 = require("class-validator");
var CustomerType;
(function (CustomerType) {
    CustomerType["KOMMUNE"] = "kommune";
    CustomerType["UNTERNEHMEN"] = "unternehmen";
    CustomerType["ORGANISATION"] = "organisation";
})(CustomerType || (exports.CustomerType = CustomerType = {}));
var AnalysisType;
(function (AnalysisType) {
    AnalysisType["INITIAL"] = "initial";
    AnalysisType["PERIODIC"] = "periodic";
    AnalysisType["ON_DEMAND"] = "on-demand";
})(AnalysisType || (exports.AnalysisType = AnalysisType = {}));
class CreateAnalysisDto {
    customerType;
    analysisType;
    dataSources;
    metadata;
}
exports.CreateAnalysisDto = CreateAnalysisDto;
__decorate([
    (0, class_validator_1.IsEnum)(CustomerType),
    __metadata("design:type", String)
], CreateAnalysisDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AnalysisType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAnalysisDto.prototype, "analysisType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateAnalysisDto.prototype, "dataSources", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAnalysisDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-analysis.dto.js.map