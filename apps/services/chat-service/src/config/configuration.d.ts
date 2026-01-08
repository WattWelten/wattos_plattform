declare const _default: () => {
    port: number;
    env: string;
    llmGateway: {
        url: string;
    };
    ragService: {
        url: string;
    };
    streaming: {
        enabled: boolean;
        chunkSize: number;
    };
    websocket: {
        enabled: boolean;
        cors: {
            origin: string | string[];
            credentials: boolean;
        };
    };
    voiceService: {
        url: string;
    };
};
export default _default;
//# sourceMappingURL=configuration.d.ts.map