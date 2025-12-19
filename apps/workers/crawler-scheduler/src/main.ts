import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CrawlerScheduler');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    logger.log('Crawler Scheduler Worker started');
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start Crawler Scheduler Worker', error);
    process.exit(1);
  }
}

bootstrap();

