import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StructuredLoggerService } from '@wattweiser/shared';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, use StructuredLoggerService
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const logger = app.get(StructuredLoggerService).setContext('LLMGateway');

  app.enableShutdownHooks();
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const port = configService.get<number>('port') || process.env.PORT || 3015;
  await app.listen(port);
  logger.log(`🚀 LLM Gateway listening on http://localhost:${port}`);
}

bootstrap();
