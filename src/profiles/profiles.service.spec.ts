import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilesService } from './profiles.service.js';

const profile = {
  id: 'profile-id',
  username: 'jane',
  bio: null,
  image: null,
};

describe('ProfilesService', () => {
  const prisma = {
    follow: {
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };

  let profilesService: ProfilesService;

  beforeEach(() => {
    vi.resetAllMocks();

    profilesService = new ProfilesService(prisma as never);
  });

  it('returns a public profile without auth', async () => {
    prisma.user.findUnique.mockResolvedValue(profile);

    await expect(profilesService.getProfile('jane')).resolves.toEqual({
      profile: {
        username: 'jane',
        bio: null,
        image: null,
        following: false,
      },
    });

    expect(prisma.follow.findUnique).not.toHaveBeenCalled();
  });

  it('returns following status for an authenticated user', async () => {
    prisma.user.findUnique.mockResolvedValue(profile);
    prisma.follow.findUnique.mockResolvedValue({
      followerId: 'current-user-id',
    });

    await expect(profilesService.getProfile('jane', 'current-user-id')).resolves.toMatchObject({
      profile: {
        username: 'jane',
        following: true,
      },
    });
  });

  it('follows a profile', async () => {
    prisma.user.findUnique.mockResolvedValue(profile);
    prisma.follow.findUnique.mockResolvedValue({
      followerId: 'current-user-id',
    });

    await expect(profilesService.followProfile('jane', 'current-user-id')).resolves.toMatchObject({
      profile: {
        username: 'jane',
        following: true,
      },
    });

    expect(prisma.follow.upsert).toHaveBeenCalledWith({
      where: {
        followerId_followingId: {
          followerId: 'current-user-id',
          followingId: 'profile-id',
        },
      },
      create: {
        followerId: 'current-user-id',
        followingId: 'profile-id',
      },
      update: {},
    });
  });

  it('unfollows a profile', async () => {
    prisma.user.findUnique.mockResolvedValue(profile);
    prisma.follow.findUnique.mockResolvedValue(null);

    await expect(profilesService.unfollowProfile('jane', 'current-user-id')).resolves.toMatchObject(
      {
        profile: {
          username: 'jane',
          following: false,
        },
      },
    );

    expect(prisma.follow.deleteMany).toHaveBeenCalledWith({
      where: {
        followerId: 'current-user-id',
        followingId: 'profile-id',
      },
    });
  });

  it('rejects following yourself', async () => {
    prisma.user.findUnique.mockResolvedValue(profile);

    await expect(profilesService.followProfile('jane', 'profile-id')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('throws when profile does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(profilesService.getProfile('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
