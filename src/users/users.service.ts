import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserInput } from './dto/create-user.dto.js';
import type { LoginUserInput } from './dto/login-user.dto.js';
import type { UpdateUserInput } from './dto/update-user.dto.js';
import type { PublicUser, UserResponse } from './user-response.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async createUser(input: CreateUserInput): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          passwordHash: await this.authService.hashPassword(input.password),
        },
        select: publicUserSelect,
      });

      return this.toUserResponse(user);
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async loginUser(input: LoginUserInput): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });

    if (!user || !(await this.authService.verifyPassword(user.passwordHash, input.password))) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['Email or password is invalid'],
        },
      });
    }

    return this.toUserResponse(user);
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.findExistingUser(userId);

    return this.toUserResponse(user);
  }

  async updateCurrentUser(userId: string, input: UpdateUserInput): Promise<UserResponse> {
    const data: Prisma.UserUpdateInput = {};

    if (input.email !== undefined) {
      data.email = input.email;
    }

    if (input.username !== undefined) {
      data.username = input.username;
    }

    if (input.password !== undefined) {
      data.passwordHash = await this.authService.hashPassword(input.password);
    }

    if (input.bio !== undefined) {
      data.bio = input.bio;
    }

    if (input.image !== undefined) {
      data.image = input.image;
    }

    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data,
        select: publicUserSelect,
      });

      return this.toUserResponse(user);
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  private async findExistingUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: publicUserSelect,
    });

    if (!user) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['User does not exist'],
        },
      });
    }

    return user;
  }

  private async toUserResponse(user: PublicUser): Promise<UserResponse> {
    return {
      user: {
        email: user.email,
        token: await this.authService.signUserToken({
          sub: user.id,
          username: user.username,
        }),
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }

  private mapPrismaError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const fields = Array.isArray(error.meta?.target) ? error.meta.target : ['field'];

      return new UnprocessableEntityException({
        errors: {
          body: fields.map((field) => `${String(field)} is already taken`),
        },
      });
    }

    return error instanceof Error ? error : new Error('Unexpected Prisma error');
  }
}

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  bio: true,
  image: true,
} satisfies Prisma.UserSelect;
