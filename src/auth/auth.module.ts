import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { AuthTokenGuard } from './auth-token.guard.js';
import { AuthService } from './auth.service.js';
import { OptionalAuthTokenGuard } from './optional-auth-token.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as JwtExpiresIn,
          },
        };
      },
    }),
  ],
  providers: [AuthService, AuthTokenGuard, OptionalAuthTokenGuard],
  exports: [AuthService, AuthTokenGuard, OptionalAuthTokenGuard],
})
export class AuthModule {}
