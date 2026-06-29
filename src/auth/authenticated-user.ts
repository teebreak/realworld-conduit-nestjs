import type { AuthenticatedRequest } from './auth-token.guard.js';

export type AuthenticatedUser = NonNullable<AuthenticatedRequest['user']>;

export function requireAuthenticatedUser(user: AuthenticatedRequest['user']): AuthenticatedUser {
  if (!user) {
    throw new Error('Authenticated user is missing');
  }

  return user;
}
