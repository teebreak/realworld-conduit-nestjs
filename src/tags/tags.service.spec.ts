import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TagsService } from './tags.service.js';

describe('TagsService', () => {
  const prisma = {
    tag: {
      findMany: vi.fn(),
    },
  };

  let tagsService: TagsService;

  beforeEach(() => {
    vi.resetAllMocks();
    tagsService = new TagsService(prisma as never);
  });

  it('returns tag names', async () => {
    prisma.tag.findMany.mockResolvedValue([{ name: 'nestjs' }, { name: 'prisma' }]);

    await expect(tagsService.getTags()).resolves.toEqual({
      tags: ['nestjs', 'prisma'],
    });
  });
});
