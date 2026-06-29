import { ValidationPipe } from '@nestjs/common';
import { validationError } from './realworld-errors.js';

export const realWorldValidationPipe = new ValidationPipe({
  exceptionFactory: validationError,
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});
