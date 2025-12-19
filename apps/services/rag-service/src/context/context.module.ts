import { Module } from '@nestjs/common';
import { ContextService } from './context.service';
import { ContextController } from './context.controller';

@Module({
  providers: [ContextService],
  controllers: [ContextController],
  exports: [ContextService],
})
export class ContextModule {}


