import type { User } from '../../generated/prisma/client.js';

export interface UserResponse {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
}

export type PublicUser = Pick<User, 'id' | 'email' | 'username' | 'bio' | 'image'>;
