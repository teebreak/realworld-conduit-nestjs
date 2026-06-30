import { Prisma } from '../../generated/prisma/client.js';
import type { ArticleView, CommentView, ListedArticleView } from './article-response.js';

export const articleInclude = {
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

export const commentInclude = {
  author: {
    select: {
      id: true,
      username: true,
      bio: true,
      image: true,
    },
  },
} satisfies Prisma.CommentInclude;

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

export type CommentWithRelations = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

export function toArticleView(
  article: ArticleWithRelations,
  state: { favorited: boolean; followingAuthor: boolean },
): ArticleView {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.articleTags.map((articleTag) => articleTag.tag.name),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: state.favorited,
    favoritesCount: article.favoritesCount,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: state.followingAuthor,
    },
  };
}

export function toListedArticleView(article: ArticleView): ListedArticleView {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    tagList: article.tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: article.favorited,
    favoritesCount: article.favoritesCount,
    author: article.author,
  };
}

export function toCommentView(
  comment: CommentWithRelations,
  state: { followingAuthor: boolean },
): CommentView {
  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: state.followingAuthor,
    },
  };
}
