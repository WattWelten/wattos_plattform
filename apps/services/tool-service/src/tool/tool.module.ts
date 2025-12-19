import { Module } from '@nestjs/common';
import { ToolController } from './tool.controller';
import { ToolService } from './tool.service';
import { RegistryModule } from '../registry/registry.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [RegistryModule, AdaptersModule, ExecutionModule],
  controllers: [ToolController],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}


