import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ServiceDiscoveryService } from '@wattweiser/shared';
export declare class AvatarService {
    private readonly configService;
    private readonly httpService;
    private readonly serviceDiscovery;
    private readonly logger;
    private readonly avatarConfigs;
    constructor(configService: ConfigService, httpService: HttpService, serviceDiscovery: ServiceDiscoveryService);
    generateAvatar(agentId: string, text: string, voiceId?: string): Promise<{
        avatarUrl: string;
        audioUrl: string;
        videoUrl?: string;
    }>;
    private getAvatarConfig;
    streamAvatar(agentId: string): Promise<{
        streamUrl: string;
        websocketUrl: string;
        sceneConfig: any;
    }>;
    exportAvatarScene(agentId: string): Promise<any>;
}
//# sourceMappingURL=avatar.service.d.ts.map