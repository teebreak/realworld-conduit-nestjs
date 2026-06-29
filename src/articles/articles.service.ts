import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ArticleResponse,
  ArticleView,
  CommentResponse,
  CommentView,
  MultipleArticlesResponse,
  MultipleCommentsResponse,
} from './article-response.js';
import type { ArticleQueryDto } from './dto/article-query.dto.js';
import type { CreateArticleInput } from './dto/create-article.dto.js';
import type { CreateCommentInput } from './dto/create-comment.dto.js';
import type { UpdateArticleInput } from './dto/update-article.dto.js';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async getArticles(
    query: ArticleQueryDto,
    currentUserId?: string,
  ): Promise<MultipleArticlesResponse> {
    const where = this.buildArticleWhere(query);
    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: await Promise.all(
        articles.map((article) => this.toArticleView(article, currentUserId)),
      ),
      articlesCount,
    };
  }

  async getFeed(userId: string, query: ArticleQueryDto): Promise<MultipleArticlesResponse> {
    const where: Prisma.ArticleWhereInput = {
      author: {
        followers: {
          some: {
            followerId: userId,
          },
        },
      },
    };
    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: {
          createdAt: 'desc',
        },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: await Promise.all(articles.map((article) => this.toArticleView(article, userId))),
      articlesCount,
    };
  }

  async createArticle(userId: string, input: CreateArticleInput): Promise<ArticleResponse> {
    try {
      const article = await this.prisma.article.create({
        data: {
          slug: slugify(input.title),
          title: input.title,
          description: input.description,
          body: input.body,
          authorId: userId,
          articleTags: this.toArticleTagsCreate(input.tagList),
        },
        include: articleInclude,
      });

      return {
        article: await this.toArticleView(article, userId),
      };
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async getArticle(slug: string, currentUserId?: string): Promise<ArticleResponse> {
    const article = await this.findArticle(slug);

    return {
      article: await this.toArticleView(article, currentUserId),
    };
  }

  async updateArticle(
    slug: string,
    userId: string,
    input: UpdateArticleInput,
  ): Promise<ArticleResponse> {
    const article = await this.findArticle(slug);
    this.assertArticleOwner(article.authorId, userId);

    const data: Prisma.ArticleUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title;
      data.slug = slugify(input.title);
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.body !== undefined) {
      data.body = input.body;
    }

    if (input.tagList !== undefined) {
      data.articleTags = {
        deleteMany: {},
        ...this.toArticleTagsCreate(input.tagList),
      };
    }

    try {
      const updatedArticle = await this.prisma.article.update({
        where: {
          id: article.id,
        },
        data,
        include: articleInclude,
      });

      return {
        article: await this.toArticleView(updatedArticle, userId),
      };
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async deleteArticle(slug: string, userId: string): Promise<void> {
    const article = await this.findArticle(slug);
    this.assertArticleOwner(article.authorId, userId);

    await this.prisma.article.delete({
      where: {
        id: article.id,
      },
    });
  }

  async favoriteArticle(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.findArticle(slug);
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    });

    if (!favorite) {
      await this.prisma.$transaction([
        this.prisma.favorite.create({
          data: {
            userId,
            articleId: article.id,
          },
        }),
        this.prisma.article.update({
          where: {
            id: article.id,
          },
          data: {
            favoritesCount: {
              increment: 1,
            },
          },
        }),
      ]);
    }

    return this.getArticle(article.slug, userId);
  }

  async unfavoriteArticle(slug: string, userId: string): Promise<ArticleResponse> {
    const article = await this.findArticle(slug);
    const result = await this.prisma.favorite.deleteMany({
      where: {
        userId,
        articleId: article.id,
      },
    });

    if (result.count > 0) {
      await this.prisma.article.update({
        where: {
          id: article.id,
        },
        data: {
          favoritesCount: {
            decrement: 1,
          },
        },
      });
    }

    return this.getArticle(article.slug, userId);
  }

  async getComments(slug: string, currentUserId?: string): Promise<MultipleCommentsResponse> {
    const article = await this.findArticle(slug);
    const comments = await this.prisma.comment.findMany({
      where: {
        articleId: article.id,
      },
      include: commentInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      comments: await Promise.all(
        comments.map((comment) => this.toCommentView(comment, currentUserId)),
      ),
    };
  }

  async createComment(
    slug: string,
    userId: string,
    input: CreateCommentInput,
  ): Promise<CommentResponse> {
    const article = await this.findArticle(slug);
    const comment = await this.prisma.comment.create({
      data: {
        body: input.body,
        articleId: article.id,
        authorId: userId,
      },
      include: commentInclude,
    });

    return {
      comment: await this.toCommentView(comment, userId),
    };
  }

  async deleteComment(slug: string, commentId: number, userId: string): Promise<void> {
    const article = await this.findArticle(slug);
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        articleId: article.id,
      },
    });

    if (!comment) {
      throw this.notFound('comment');
    }

    if (comment.authorId !== userId) {
      throw this.forbidden('comment');
    }

    await this.prisma.comment.delete({
      where: {
        id: comment.id,
      },
    });
  }

  private buildArticleWhere(query: ArticleQueryDto): Prisma.ArticleWhereInput {
    return {
      ...(query.author
        ? {
            author: {
              username: query.author,
            },
          }
        : {}),
      ...(query.favorited
        ? {
            favorites: {
              some: {
                user: {
                  username: query.favorited,
                },
              },
            },
          }
        : {}),
      ...(query.tag
        ? {
            articleTags: {
              some: {
                tag: {
                  name: query.tag,
                },
              },
            },
          }
        : {}),
    };
  }

  private async findArticle(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: articleInclude,
    });

    if (!article) {
      throw this.notFound('article');
    }

    return article;
  }

  private assertArticleOwner(authorId: string, userId: string) {
    if (authorId !== userId) {
      throw this.forbidden('article');
    }
  }

  private async toArticleView(
    article: ArticleWithRelations,
    currentUserId?: string,
  ): Promise<ArticleView> {
    const [following, favorited] = await Promise.all([
      currentUserId ? this.isFollowing(currentUserId, article.authorId) : false,
      currentUserId ? this.isFavorited(currentUserId, article.id) : false,
    ]);

    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.articleTags.map((articleTag) => articleTag.tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited,
      favoritesCount: article.favoritesCount,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following,
      },
    };
  }

  private async toCommentView(
    comment: CommentWithRelations,
    currentUserId?: string,
  ): Promise<CommentView> {
    const following = currentUserId
      ? await this.isFollowing(currentUserId, comment.authorId)
      : false;

    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
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

  private async isFavorited(userId: string, articleId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      select: {
        userId: true,
      },
    });

    return Boolean(favorite);
  }

  private toArticleTagsCreate(tagList: string[] = []) {
    const uniqueTags = [...new Set(tagList.map((tag) => tag.trim()).filter(Boolean))];

    return {
      create: uniqueTags.map((tag) => ({
        tag: {
          connectOrCreate: {
            where: {
              name: tag,
            },
            create: {
              name: tag,
            },
          },
        },
      })),
    };
  }

  private mapPrismaError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new UnprocessableEntityException({
        errors: {
          body: ['slug is already taken'],
        },
      });
    }

    return error instanceof Error ? error : new Error('Unexpected Prisma error');
  }

  private forbidden(resource: string) {
    return new ForbiddenException({
      errors: {
        [resource]: ['forbidden'],
      },
    });
  }

  private notFound(resource: string) {
    return new NotFoundException({
      errors: {
        [resource]: ['not found'],
      },
    });
  }
}

const articleInclude = {
  author: {
    select: {
      id: true,
      username: true,
      bio: true,
      image: true,
    },
  },
  articleTags: {
    include: {
      tag: true,
    },
    orderBy: {
      tag: {
        name: 'asc',
      },
    },
  },
} satisfies Prisma.ArticleInclude;

const commentInclude = {
  author: {
    select: {
      id: true,
      username: true,
      bio: true,
      image: true,
    },
  },
} satisfies Prisma.CommentInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'article';
}
