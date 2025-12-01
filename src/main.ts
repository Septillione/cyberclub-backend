import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
  console.log('Application is running on: http://cctournaments.ccmanager.ru/api/v1');
}
bootstrap();
