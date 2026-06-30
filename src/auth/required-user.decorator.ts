import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth-token.guard.js';
import type { AuthenticatedUser } from './authenticated-user.js';
import { requireAuthenticatedUser } from './authenticated-user.js';

export const RequiredUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return requireAuthenticatedUser(request.user);
  },
);
