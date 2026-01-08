import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { StructuredLoggerService } from '@wattweiser/shared';
import compression from 'compression';
import helmet from 'helmet';
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger, use StructuredLoggerService
  });
  const configService = app.get(ConfigService);
  const logger = app.get(StructuredLoggerService).setContext('Gateway');

  // Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: configService.get<string>('NODE_ENV') === 'production',
      crossOriginEmbedderPolicy: false, // Für Swagger UI
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Response Compression
  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        // Komprimiere nur wenn Client es unterstützt
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Komprimiere nur JSON, Text und HTML
        return compression.filter(req, res);
      },
      level: 6, // Balance zwischen Kompression und CPU
      threshold: 1024, // Nur Dateien > 1KB komprimieren
    })
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS mit Allowlist
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({
    origin: (origin, callback) => {
      // Erlaube Requests ohne Origin (z.B. Postman, mobile Apps)
      if (!origin) {
        return callback(null, true);
      }
      // Prüfe ob Origin in Allowlist ist
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
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
  if (
    configService.get<string>('NODE_ENV') !== 'production' ||
    configService.get<boolean>('ENABLE_SWAGGER', false)
  ) {
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
        'JWT-auth'
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

    // Export OpenAPI spec to JSON (if enabled)
    if (configService.get<boolean>('EXPORT_OPENAPI_SPEC', false)) {
      const fs = require('fs');
      const path = require('path');
      const specPath = path.join(process.cwd(), 'openapi', 'gateway-api.json');
      const specDir = path.dirname(specPath);

      if (!fs.existsSync(specDir)) {
        fs.mkdirSync(specDir, { recursive: true });
      }

      fs.writeFileSync(specPath, JSON.stringify(document, null, 2));
      logger.log(`📄 OpenAPI spec exported to: ${specPath}`);
    }

    logger.log(
      `📚 API Documentation available at: http://localhost:${configService.get<number>('PORT', 3001)}/api/docs`
    );
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  logger.log(`🚀 API Gateway running on: http://localhost:${port}`);
}

bootstrap();
