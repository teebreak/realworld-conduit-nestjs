import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { realWorldValidationPipe } from './common/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(realWorldValidationPipe);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
