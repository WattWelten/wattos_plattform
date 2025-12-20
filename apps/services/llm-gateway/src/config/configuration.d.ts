declare const _default: () => {
    port: number;
    defaultProvider: string;
    providers: {
        openai: {
            apiKey: string | undefined;
            baseUrl: string;
        };
        azure: {
            apiKey: string | undefined;
            endpoint: string | undefined;
            deployment: string | undefined;
            apiVersion: string;
        };
        anthropic: {
            apiKey: string | undefined;
            baseUrl: string;
        };
        google: {
            apiKey: string | undefined;
            baseUrl: string;
        };
        ollama: {
            baseUrl: string;
            model: string;
        };
    };
    costTracking: {
        enabled: boolean;
        alertThreshold: number;
    };
};
export default _default;
//# sourceMappingURL=configuration.d.ts.map