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
var HttpAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAdapter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let HttpAdapter = HttpAdapter_1 = class HttpAdapter {
    httpService;
    logger = new common_1.Logger(HttpAdapter_1.name);
    constructor(httpService) {
        this.httpService = httpService;
    }
    async execute(request) {
        const startTime = Date.now();
        try {
            const { method, url, headers = {}, body } = request.input;
            if (!method || !url) {
                throw new Error('Method and URL are required');
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request({
                method: method,
                url,
                headers,
                data: body,
                timeout: 30000,
            }));
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                output: {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    data: response.data,
                },
                executionTime,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`HTTP request failed: ${error.message}`);
            return {
                success: false,
                error: error.message || 'HTTP request failed',
                executionTime,
            };
        }
    }
    async validateInput(input) {
        if (!input.method || !input.url) {
            return false;
        }
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        if (!validMethods.includes(input.method.toUpperCase())) {
            return false;
        }
        try {
            new URL(input.url);
            return true;
        }
        catch {
            return false;
        }
    }
    async healthCheck() {
        try {
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.HttpAdapter = HttpAdapter;
exports.HttpAdapter = HttpAdapter = HttpAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], HttpAdapter);
//# sourceMappingURL=http.adapter.js.map