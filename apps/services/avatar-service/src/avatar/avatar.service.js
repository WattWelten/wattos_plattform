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
var AvatarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const shared_1 = require("@wattweiser/shared");
let AvatarService = AvatarService_1 = class AvatarService {
    configService;
    httpService;
    serviceDiscovery;
    logger = new common_1.Logger(AvatarService_1.name);
    avatarConfigs = new Map();
    constructor(configService, httpService, serviceDiscovery) {
        this.configService = configService;
        this.httpService = httpService;
        this.serviceDiscovery = serviceDiscovery;
    }
    async generateAvatar(agentId, text, voiceId) {
        try {
            const voiceServiceUrl = this.serviceDiscovery.getServiceUrl('voice-service', 3016);
            const ttsResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${voiceServiceUrl}/api/v1/voice/tts`, {
                text,
                voice: voiceId || 'alloy',
                language: 'de',
            }, {
                responseType: 'arraybuffer',
            }));
            const audioBuffer = Buffer.from(ttsResponse.data);
            const audioBase64 = audioBuffer.toString('base64');
            const avatarConfig = await this.getAvatarConfig(agentId);
            return {
                avatarUrl: `/api/v1/avatar/${agentId}/scene`,
                audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
                sceneConfig: avatarConfig,
            };
        }
        catch (error) {
            this.logger.error(`Avatar generation failed: ${error.message}`);
            throw error;
        }
    }
    async getAvatarConfig(agentId) {
        if (this.avatarConfigs.has(agentId)) {
            return this.avatarConfigs.get(agentId);
        }
        const config = {
            agentId,
            model: {
                type: 'gltf',
                url: null,
                fallback: 'box',
            },
            scene: {
                camera: {
                    position: { x: 0, y: 2, z: -5 },
                    target: { x: 0, y: 0, z: 0 },
                    fov: 0.8,
                },
                lights: [
                    {
                        type: 'hemispheric',
                        name: 'light1',
                        direction: { x: 0, y: 1, z: 0 },
                        intensity: 0.7,
                    },
                    {
                        type: 'directional',
                        name: 'light2',
                        direction: { x: -1, y: -1, z: -1 },
                        intensity: 0.5,
                    },
                ],
                background: {
                    color: { r: 0.1, g: 0.1, b: 0.15 },
                },
            },
            avatar: {
                position: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                rotation: { x: 0, y: 0, z: 0 },
                material: {
                    type: 'standard',
                    diffuseColor: { r: 0.5, g: 0.5, b: 0.8 },
                    specularColor: { r: 0.2, g: 0.2, b: 0.2 },
                },
                animations: {
                    lipSync: {
                        enabled: true,
                        property: 'position.y',
                        range: [0, 0.1],
                    },
                },
            },
        };
        this.avatarConfigs.set(agentId, config);
        this.logger.log(`Avatar config created for agent ${agentId}`);
        return config;
    }
    async streamAvatar(agentId) {
        try {
            const sceneConfig = await this.getAvatarConfig(agentId);
            const port = this.configService.get('port', 3009);
            const baseUrl = this.configService.get('BASE_URL', `http://localhost:${port}`);
            const websocketUrl = `ws://${baseUrl.replace('http://', '').replace('https://', '')}/avatar/stream/${agentId}`;
            return {
                streamUrl: `/api/v1/avatar/${agentId}/stream`,
                websocketUrl,
                sceneConfig,
            };
        }
        catch (error) {
            this.logger.error(`Avatar streaming setup failed: ${error.message}`);
            throw error;
        }
    }
    async exportAvatarScene(agentId) {
        const sceneConfig = await this.getAvatarConfig(agentId);
        return {
            agentId,
            ...sceneConfig,
        };
    }
};
exports.AvatarService = AvatarService;
exports.AvatarService = AvatarService = AvatarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        shared_1.ServiceDiscoveryService])
], AvatarService);
//# sourceMappingURL=avatar.service.js.map