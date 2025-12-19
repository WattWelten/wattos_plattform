import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';
import { EmbeddingCodeGeneratorService } from './embedding-code-generator.service';

@Module({
  controllers: [WidgetController],
  providers: [
    WidgetService,
    EmbeddingCodeGeneratorService,
  ],
  exports: [WidgetService],
})
export class WidgetModule {}

