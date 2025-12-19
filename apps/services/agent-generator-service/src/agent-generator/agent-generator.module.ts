import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentGeneratorController } from './agent-generator.controller';
import { AgentGeneratorService } from './agent-generator.service';
import { ToolSelectorService } from './tool-selector.service';
import { RAGConfigService } from './rag-config.service';
import { AgentValidatorService } from './agent-validator.service';

@Module({
  imports: [HttpModule],
  controllers: [AgentGeneratorController],
  providers: [
    AgentGeneratorService,
    ToolSelectorService,
    RAGConfigService,
    AgentValidatorService,
  ],
  exports: [AgentGeneratorService],
})
export class AgentGeneratorModule {}


