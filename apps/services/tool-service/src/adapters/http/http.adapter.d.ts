import { HttpService } from '@nestjs/axios';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';
export declare class HttpAdapter implements IToolAdapter {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
    validateInput(input: Record<string, any>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=http.adapter.d.ts.map