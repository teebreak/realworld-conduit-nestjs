import { UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

const user = {
  id: 'user-id',
  email: 'jane@example.com',
  username: 'jane',
  bio: null,
  image: null,
};

describe('UsersService', () => {
  const authService = {
    hashPassword: vi.fn(),
    signUserToken: vi.fn(),
    verifyPassword: vi.fn(),
  };
  const prisma = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  let usersService: UsersService;

  beforeEach(() => {
    vi.resetAllMocks();

    authService.hashPassword.mockResolvedValue('hashed-password');
    authService.signUserToken.mockResolvedValue('jwt-token');

    usersService = new UsersService(authService as never, prisma as never);
  });

  it('registers a user and returns a RealWorld user response', async () => {
    prisma.user.create.mockResolvedValue(user);

    await expect(
      usersService.createUser({
        email: 'jane@example.com',
        username: 'jane',
        password: 'password123',
      }),
    ).resolves.toEqual({
      user: {
        email: 'jane@example.com',
        token: 'jwt-token',
        username: 'jane',
        bio: null,
        image: null,
      },
    });

    expect(authService.hashPassword).toHaveBeenCalledWith('password123');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'jane@example.com',
        username: 'jane',
        passwordHash: 'hashed-password',
      },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        image: true,
      },
    });
  });

  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash: 'hashed-password',
    });
    authService.verifyPassword.mockResolvedValue(true);

    await expect(
      usersService.loginUser({
        email: 'jane@example.com',
        password: 'password123',
      }),
    ).resolves.toMatchObject({
      user: {
        email: 'jane@example.com',
        token: 'jwt-token',
      },
    });

    expect(authService.verifyPassword).toHaveBeenCalledWith('hashed-password', 'password123');
  });

  it('rejects invalid login credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash: 'hashed-password',
    });
    authService.verifyPassword.mockResolvedValue(false);

    await expect(
      usersService.loginUser({
        email: 'jane@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('returns the current user', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(usersService.getCurrentUser('user-id')).resolves.toEqual({
      user: {
        email: 'jane@example.com',
        token: 'jwt-token',
        username: 'jane',
        bio: null,
        image: null,
      },
    });
  });
});
