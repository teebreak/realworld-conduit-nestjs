import { Prisma } from '../../generated/prisma/client.js';

export function getUniqueConstraintFields(error: Prisma.PrismaClientKnownRequestError) {
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
