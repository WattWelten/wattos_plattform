import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { StructuredLoggerService } from '@wattweiser/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, use StructuredLoggerService
  });
  const configService = app.get(ConfigService);
  const logger = app.get(StructuredLoggerService);

  // Global prefix
  app.setGlobalPrefix('v1');

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT', 3013);
  await app.listen(port);

  logger.info('Character Service started', {
    port,
    environment: configService.get('NODE_ENV', 'development'),
  });
}

bootstrap();

