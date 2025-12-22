declare const _default: () => {
    port: number;
    env: string;
    sandbox: {
        enabled: boolean;
        timeout: number;
    };
    adapters: {
        email: {
            host: string;
            port: number;
            user: string;
            password: string;
        };
        jira: {
            host: string;
            email: string;
            apiToken: string;
        };
        slack: {
            token: string;
        };
    };
};
export default _default;
//# sourceMappingURL=configuration.d.ts.map