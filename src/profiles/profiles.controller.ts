import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthTokenGuard } from '../auth/auth-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-token.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { OptionalAuthTokenGuard } from '../auth/optional-auth-token.guard.js';
import { ProfilesService } from './profiles.service.js';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @UseGuards(OptionalAuthTokenGuard)
  getProfile(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    return this.profilesService.getProfile(username, user?.id);
  }

  @Post(':username/follow')
  @UseGuards(AuthTokenGuard)
  followProfile(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    if (!user) {
      throw new Error('Authenticated user is missing');
    }

    return this.profilesService.followProfile(username, user.id);
  }

  @Delete(':username/follow')
  @UseGuards(AuthTokenGuard)
  unfollowProfile(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    if (!user) {
      throw new Error('Authenticated user is missing');
    }

    return this.profilesService.unfollowProfile(username, user.id);
  }
}
