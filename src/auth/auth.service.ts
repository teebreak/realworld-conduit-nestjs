import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { tokenInvalidError } from '../common/realworld-errors.js';

export interface AuthTokenPayload {
  sub: string;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  hashPassword(password: string) {
    return hash(password);
  }

  async verifyPassword(hashValue: string, password: string) {
    return verify(hashValue, password);
  }

  signUserToken(payload: AuthTokenPayload) {
    return this.jwtService.signAsync(payload);
  }

  async verifyUserToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<AuthTokenPayload>(token);
    } catch {
      throw tokenInvalidError();
    }
  }
}
