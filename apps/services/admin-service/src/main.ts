import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// ThrottlerGuard wird über APP_GUARD Provider in app.module.ts konfiguriert
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { StructuredLoggerService } from '@wattweiser/shared';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, use StructuredLoggerService
  });
  const configService = app.get(ConfigService);
  const logger = app.get(StructuredLoggerService);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',') || '*',
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

  // Rate Limiting
  app.useGlobalGuards(new ThrottlerGuard());

  const port = configService.get<number>('PORT', 3007);
  await app.listen(port);

  logger.info('Admin Service started', {
    port,
    environment: configService.get('NODE_ENV', 'development'),
  });
}

bootstrap();


