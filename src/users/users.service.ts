import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
      throw new UnauthorizedException({
        errors: {
          credentials: ['invalid'],
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
      data.bio = normalizeNullableText(input.bio);
    }

    if (input.image !== undefined) {
      data.image = normalizeNullableText(input.image);
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
      const fields = getUniqueConstraintFields(error);

      return new ConflictException({
        errors: {
          ...Object.fromEntries(fields.map((field) => [String(field), ['has already been taken']])),
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

function normalizeNullableText(value: string | null) {
  return value === '' ? null : value;
}

function getUniqueConstraintFields(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.map(String);
  }

  if (typeof target === 'string') {
    return [target];
  }

  const errorText = JSON.stringify(error);

  if (errorText.includes('users_username_key')) {
    return ['username'];
  }

  if (errorText.includes('users_email_key')) {
    return ['email'];
  }

  return ['field'];
}
