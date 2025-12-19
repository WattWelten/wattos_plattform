import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { StructuredLoggerService } from '@wattweiser/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, use StructuredLoggerService
  });
  const configService = app.get(ConfigService);
  const logger = app.get(StructuredLoggerService).setContext('Gateway');

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger/OpenAPI Documentation
  if (configService.get<string>('NODE_ENV') !== 'production' || configService.get<boolean>('ENABLE_SWAGGER', false)) {
    const config = new DocumentBuilder()
      .setTitle('WattOS KI API')
      .setDescription('WattOS KI Platform API Documentation')
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
      .addTag('auth', 'Authentication endpoints')
      .addTag('proxy', 'Service proxy endpoints')
      .addServer(`http://localhost:${configService.get<number>('PORT', 3001)}`, 'Local Development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'WattOS KI API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    });

    logger.log(`📚 API Documentation available at: http://localhost:${configService.get<number>('PORT', 3001)}/api/docs`);
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  logger.log(`🚀 API Gateway running on: http://localhost:${port}`);
}

bootstrap();


