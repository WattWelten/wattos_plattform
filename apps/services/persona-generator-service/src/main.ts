import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ObservabilityModule, HealthController } from '@wattweiser/shared';

async function bootstrap() {
  const logger = new Logger('PersonaGeneratorService');
  const port = process.env.PORT || process.env.PERSONA_GENERATOR_SERVICE_PORT || 3020;

  try {
    const app = await NestFactory.create(AppModule);
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/v1');

    await app.listen(port);
    logger.log(`Persona Generator Service started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start Persona Generator Service', error);
    process.exit(1);
  }
}

bootstrap();


