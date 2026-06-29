import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function forbiddenError(resource: string) {
  return new ForbiddenException({
    errors: {
      [resource]: ['forbidden'],
    },
  });
}

export function notFoundError(resource: string) {
  return new NotFoundException({
    errors: {
      [resource]: ['not found'],
    },
  });
}

export function tokenMissingError() {
  return new UnauthorizedException({
    errors: {
      token: ['is missing'],
    },
  });
}

export function tokenInvalidError() {
  return new UnauthorizedException({
    errors: {
      token: ['is invalid'],
    },
  });
}

export function validationError(errors: ValidationError[]) {
  return new UnprocessableEntityException({
    errors: toValidationErrorResponse(errors),
  });
}

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
