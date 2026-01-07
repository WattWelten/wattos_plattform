import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// ThrottlerGuard wird über APP_GUARD Provider in app.module.ts konfiguriert
import { AppModule } from './app.module';
import { StructuredLoggerService } from '@wattweiser/shared';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, use StructuredLoggerService
  });
  const logger = app.get(StructuredLoggerService).setContext('AgentService');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Rate Limiting wird über APP_GUARD Provider in app.module.ts konfiguriert

  const port = process.env.PORT || 3003;
  await app.listen(port);

  logger.log(`🚀 Agent Service running on http://localhost:${port}`);
}

bootstrap();


