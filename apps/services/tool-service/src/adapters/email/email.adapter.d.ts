import { ConfigService } from '@nestjs/config';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';
export declare class EmailAdapter implements IToolAdapter {
    private readonly configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    private initializeTransporter;
    execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
    validateInput(input: Record<string, any>): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=email.adapter.d.ts.map