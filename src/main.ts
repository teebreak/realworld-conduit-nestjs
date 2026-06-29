import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          errors: toValidationErrorResponse(errors),
        }),
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

function toValidationErrorResponse(errors: ValidationError[]) {
  return errors.reduce<Record<string, string[]>>((result, error) => {
    for (const child of error.children ?? []) {
      const fieldErrors = toValidationErrorResponse([child]);

      for (const [field, messages] of Object.entries(fieldErrors)) {
        result[field] = [...(result[field] ?? []), ...messages];
      }
    }

    const constraints = error.constraints ?? {};
    const messages = 'isNotEmpty' in constraints ? ["can't be blank"] : Object.values(constraints);

    if (messages.length > 0) {
      result[error.property] = messages;
    }

    return result;
  }, {});
}
