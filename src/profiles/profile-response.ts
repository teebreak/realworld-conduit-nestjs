import type { User } from '../../generated/prisma/client.js';

export interface ProfileResponse {
  profile: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export type ProfileUser = Pick<User, 'id' | 'username' | 'bio' | 'image'>;
