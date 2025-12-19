import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WidgetModule } from './widget/widget.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WidgetModule,
  ],
})
export class AppModule {}


