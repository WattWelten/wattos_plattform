import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({ origin: '*' });
  const port = process.env.PORT || 3012;
  await app.listen(port);
  console.log(`🌐 Metaverse Service running on http://localhost:${port}`);
}
bootstrap();


