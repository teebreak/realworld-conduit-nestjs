import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth-token.guard.js';

@Injectable()
export class OptionalAuthTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');

    if (!authorization) {
      return true;
    }

    if (!authorization.startsWith('Token ')) {
      return true;
    }

    const token = authorization.slice('Token '.length).trim();

    if (!token) {
      return true;
    }

    const payload = await this.authService.verifyUserToken(token);

    request.user = {
      id: payload.sub,
      username: payload.username,
    };

    return true;
  }
}
