import { Module, forwardRef } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { GraphModule } from '../graph/graph.module';
import { HitlModule } from '../hitl/hitl.module';

@Module({
  imports: [GraphModule, forwardRef(() => HitlModule)],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}

