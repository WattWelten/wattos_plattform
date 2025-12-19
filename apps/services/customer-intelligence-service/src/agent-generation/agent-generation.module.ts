import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@wattweiser/db';
import { AgentGenerationController } from './agent-generation.controller';
import { AgentGenerationService } from './agent-generation.service';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [AgentGenerationController],
  providers: [AgentGenerationService],
  exports: [AgentGenerationService],
})
export class AgentGenerationModule {}

