import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@wattweiser/shared';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || process.env.CORS_ORIGINS?.split(',') || (process.env.NODE_ENV === 'production' ? [] : ['*']);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
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

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || process.env.CRAWLER_SERVICE_PORT || 3015;
  await app.listen(port);

  console.log(`🕷️ Crawler Service running on http://localhost:${port}`);
}

bootstrap();

