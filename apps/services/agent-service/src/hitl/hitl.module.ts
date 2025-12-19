import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HitlService } from './hitl.service';
import { HitlController } from './hitl.controller';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [HttpModule, forwardRef(() => AgentModule)],
  providers: [HitlService],
  controllers: [HitlController],
  exports: [HitlService],
})
export class HitlModule {}

