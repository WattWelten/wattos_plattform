import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { StructuredLoggerService } from '@wattweiser/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLoggerService('WhatsAppBotService'),
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  const port = process.env.PORT || process.env.WHATSAPP_BOT_SERVICE_PORT || 3019;
  await app.listen(port);

  console.log(`💬 WhatsApp-Bot Service is running on: http://localhost:${port}`);
}

bootstrap();

