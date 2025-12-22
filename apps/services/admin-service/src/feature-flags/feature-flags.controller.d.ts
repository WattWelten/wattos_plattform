import { FeatureFlagService, FeatureFlag } from '@wattweiser/shared';
export declare class FeatureFlagsController {
    private readonly featureFlagService;
    constructor(featureFlagService: FeatureFlagService);
    getAllFlags(): Promise<FeatureFlag[]>;
    getFlag(key: string): Promise<FeatureFlag | null>;
    checkFlag(key: string, userId?: string): Promise<{
        enabled: boolean;
    }>;
    createFlag(flag: FeatureFlag): Promise<FeatureFlag>;
    updateFlag(key: string, flag: Partial<FeatureFlag>): Promise<FeatureFlag>;
    deleteFlag(key: string): Promise<{
        success: boolean;
    }>;
    emergencyDisable(): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=feature-flags.controller.d.ts.map