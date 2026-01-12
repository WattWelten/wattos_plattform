import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const logger = app.get('StructuredLoggerService')?.setContext?.('DashboardService') || console;

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

  // Rate Limiting wird über APP_GUARD in app.module.ts konfiguriert

  // Swagger/OpenAPI Documentation (optional)
  try {
    const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('Dashboard Service API')
      .setDescription('Multi-Tenant KPI Analytics API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('analytics', 'KPI Analytics Endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('📚 Swagger documentation available at /api/docs');
  } catch (error) {
    logger.debug('Swagger not available (optional dependency)');
  }

  const port = process.env.PORT || 3011;
  await app.listen(port);

  logger.log(`📊 Dashboard Service running on http://localhost:${port}`);
}

bootstrap();















