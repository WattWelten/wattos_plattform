import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
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

  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',') || '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalGuards(new ThrottlerGuard());

  const port = configService.get<number>('PORT', 3010);
  await app.listen(port);

  logger.info('Feedback Service started', {
    port,
    environment: configService.get('NODE_ENV', 'development'),
  });
}

bootstrap();


