"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaverseService = void 0;
const common_1 = require("@nestjs/common");
let MetaverseService = class MetaverseService {
    async createRoom(name) {
        return { roomId: `room_${Date.now()}`, name, url: `https://metaverse.example.com/room/${Date.now()}` };
    }
    async getRoom(roomId) {
        return { roomId, name: 'Example Room', participants: [] };
    }
};
exports.MetaverseService = MetaverseService;
exports.MetaverseService = MetaverseService = __decorate([
    (0, common_1.Injectable)()
], MetaverseService);
//# sourceMappingURL=metaverse.service.js.map