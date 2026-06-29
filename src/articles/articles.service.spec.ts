import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticlesService } from './articles.service.js';

const author = {
  id: 'author-id',
  username: 'jane',
  bio: null,
  image: null,
};

const article = {
  id: 'article-id',
  slug: 'hello-world',
  title: 'Hello World',
  description: 'Intro',
  body: 'Body',
  authorId: 'author-id',
  author,
  articleTags: [
    {
      tag: {
        id: 'tag-id',
        name: 'intro',
      },
    },
  ],
  favoritesCount: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ArticlesService', () => {
  const prisma = {
    $transaction: vi.fn(),
    article: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    favorite: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    follow: {
      findUnique: vi.fn(),
    },
  };

  let articlesService: ArticlesService;

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.favorite.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockResolvedValue([]);

    articlesService = new ArticlesService(prisma as never);
  });

  it('creates an article with tags and returns RealWorld shape', async () => {
    prisma.article.create.mockResolvedValue(article);

    await expect(
      articlesService.createArticle('author-id', {
        title: 'Hello World!',
        description: 'Intro',
        body: 'Body',
        tagList: ['intro', 'intro', ' nest '],
      }),
    ).resolves.toMatchObject({
      article: {
        slug: 'hello-world',
        title: 'Hello World',
        tagList: ['intro'],
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'jane',
          following: false,
        },
      },
    });

    const createArgs = prisma.article.create.mock.calls[0]?.[0] as unknown;

    expect(createArgs).toMatchObject({
      data: {
        slug: 'hello-world',
        title: 'Hello World!',
        description: 'Intro',
        body: 'Body',
        authorId: 'author-id',
        articleTags: {
          create: [
            {
              tag: {
                connectOrCreate: {
                  where: {
                    name: 'intro',
                  },
                  create: {
                    name: 'intro',
                  },
                },
              },
            },
            {
              tag: {
                connectOrCreate: {
                  where: {
                    name: 'nest',
                  },
                  create: {
                    name: 'nest',
                  },
                },
              },
            },
          ],
        },
      },
    });
  });

  it('lists articles with filters and count', async () => {
    prisma.article.findMany.mockResolvedValue([article]);
    prisma.article.count.mockResolvedValue(1);

    await expect(
      articlesService.getArticles(
        {
          author: 'jane',
          favorited: 'bob',
          limit: 20,
          offset: 0,
          tag: 'intro',
        },
        'viewer-id',
      ),
    ).resolves.toMatchObject({
      articles: [
        {
          slug: 'hello-world',
        },
      ],
      articlesCount: 1,
    });

    const findManyArgs = prisma.article.findMany.mock.calls[0]?.[0] as {
      skip: number;
      take: number;
      where: {
        author?: {
          username: string;
        };
      };
    };

    expect(findManyArgs.skip).toBe(0);
    expect(findManyArgs.take).toBe(20);
    expect(findManyArgs.where.author).toEqual({
      username: 'jane',
    });
  });

  it('favorites an article once', async () => {
    prisma.article.findUnique.mockResolvedValue(article);

    await expect(
      articlesService.favoriteArticle('hello-world', 'viewer-id'),
    ).resolves.toMatchObject({
      article: {
        slug: 'hello-world',
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects article updates by non-authors', async () => {
    prisma.article.findUnique.mockResolvedValue(article);

    await expect(
      articlesService.updateArticle('hello-world', 'other-user-id', {
        title: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when an article is missing', async () => {
    prisma.article.findUnique.mockResolvedValue(null);

    await expect(articlesService.getArticle('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
