import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  await app.listen(8000);
  console.log('Application is running on: http://localhost:8000/api/v1');

  // await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
