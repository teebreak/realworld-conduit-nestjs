import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { notFoundError } from '../common/realworld-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProfileResponse, ProfileUser } from './profile-response.js';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(username: string, currentUserId?: string): Promise<ProfileResponse> {
    const profile = await this.findProfile(username);

    return this.toProfileResponse(profile, currentUserId);
  }

  async followProfile(username: string, currentUserId: string): Promise<ProfileResponse> {
    const profile = await this.findProfile(username);

    if (profile.id === currentUserId) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['You cannot follow yourself'],
        },
      });
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: profile.id,
        },
      },
      create: {
        followerId: currentUserId,
        followingId: profile.id,
      },
      update: {},
    });

    return this.toProfileResponse(profile, currentUserId);
  }

  async unfollowProfile(username: string, currentUserId: string): Promise<ProfileResponse> {
    const profile = await this.findProfile(username);

    await this.prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: profile.id,
      },
    });

    return this.toProfileResponse(profile, currentUserId);
  }

  private async findProfile(username: string) {
    const profile = await this.prisma.user.findUnique({
      where: {
        username,
      },
      select: profileSelect,
    });

    if (!profile) {
      throw notFoundError('profile');
    }

    return profile;
  }

  private async toProfileResponse(
    profile: ProfileUser,
    currentUserId?: string,
  ): Promise<ProfileResponse> {
    const following = currentUserId ? await this.isFollowing(currentUserId, profile.id) : false;

    return {
      profile: {
        username: profile.username,
        bio: profile.bio,
        image: profile.image,
        following,
      },
    };
  }

  private async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      select: {
        followerId: true,
      },
    });

    return Boolean(follow);
  }
}

const profileSelect = {
  id: true,
  username: true,
  bio: true,
  image: true,
};
