import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { AuthTokenGuard } from '../auth/auth-token.guard.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { RequiredUser } from '../auth/required-user.decorator.js';
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
  getCurrentUser(@RequiredUser() user: AuthenticatedUser) {
    return this.usersService.getCurrentUser(user.id);
  }

  @Put('user')
  @UseGuards(AuthTokenGuard)
  updateCurrentUser(@RequiredUser() user: AuthenticatedUser, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateCurrentUser(user.id, updateUserDto.user);
  }
}
