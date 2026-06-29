import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.getToken(request);
    const payload = await this.authService.verifyUserToken(token);

    request.user = {
      id: payload.sub,
      username: payload.username,
    };

    return true;
  }

  protected getToken(request: Request) {
    const authorization = request.header('authorization');

    if (!authorization?.startsWith('Token ')) {
      throw new UnauthorizedException({
        errors: {
          token: ['is missing'],
        },
      });
    }

    const token = authorization.slice('Token '.length).trim();

    if (!token) {
      throw new UnauthorizedException({
        errors: {
          token: ['is missing'],
        },
      });
    }

    return token;
  }
}
