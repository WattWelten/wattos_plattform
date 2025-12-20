"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaverseModule = void 0;
const common_1 = require("@nestjs/common");
const metaverse_controller_1 = require("./metaverse.controller");
const metaverse_service_1 = require("./metaverse.service");
let MetaverseModule = class MetaverseModule {
};
exports.MetaverseModule = MetaverseModule;
exports.MetaverseModule = MetaverseModule = __decorate([
    (0, common_1.Module)({
        controllers: [metaverse_controller_1.MetaverseController],
        providers: [metaverse_service_1.MetaverseService],
    })
], MetaverseModule);
//# sourceMappingURL=metaverse.module.js.map