import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AuthTokenGuard } from '../auth/auth-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-token.guard.js';
import { requireAuthenticatedUser } from '../auth/authenticated-user.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto.user);
  }

  @Post('users/login')
  @HttpCode(200)
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.loginUser(loginUserDto.user);
  }

  @Get('user')
  @UseGuards(AuthTokenGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.usersService.getCurrentUser(requireAuthenticatedUser(user).id);
  }

  @Put('user')
  @UseGuards(AuthTokenGuard)
  updateCurrentUser(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateCurrentUser(
      requireAuthenticatedUser(user).id,
      updateUserDto.user,
    );
  }
}
