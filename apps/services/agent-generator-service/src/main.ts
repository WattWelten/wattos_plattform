import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AgentGeneratorService');
  const port = process.env.PORT || process.env.AGENT_GENERATOR_SERVICE_PORT || 3021;

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
    logger.log(`Agent Generator Service started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start Agent Generator Service', error);
    process.exit(1);
  }
}

bootstrap();

