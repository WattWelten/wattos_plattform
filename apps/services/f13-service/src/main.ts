import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('F13Service');
  const port = process.env.PORT || process.env.F13_SERVICE_PORT || 3022;

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
    logger.log(`F13 Service started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start F13 Service', error);
    process.exit(1);
  }
}

bootstrap();


