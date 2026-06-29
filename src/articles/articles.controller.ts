import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthTokenGuard } from '../auth/auth-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-token.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { OptionalAuthTokenGuard } from '../auth/optional-auth-token.guard.js';
import { ArticleQueryDto } from './dto/article-query.dto.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateArticleDto } from './dto/update-article.dto.js';
import { ArticlesService } from './articles.service.js';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('feed')
  @UseGuards(AuthTokenGuard)
  getFeed(@Query() query: ArticleQueryDto, @CurrentUser() user: AuthenticatedRequest['user']) {
    return this.articlesService.getFeed(this.requireUserId(user), query);
  }

  @Get()
  @UseGuards(OptionalAuthTokenGuard)
  getArticles(@Query() query: ArticleQueryDto, @CurrentUser() user: AuthenticatedRequest['user']) {
    return this.articlesService.getArticles(query, user?.id);
  }

  @Post()
  @UseGuards(AuthTokenGuard)
  createArticle(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    return this.articlesService.createArticle(this.requireUserId(user), createArticleDto.article);
  }

  @Get(':slug')
  @UseGuards(OptionalAuthTokenGuard)
  getArticle(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedRequest['user']) {
    return this.articlesService.getArticle(slug, user?.id);
  }

  @Put(':slug')
  @UseGuards(AuthTokenGuard)
  updateArticle(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    return this.articlesService.updateArticle(
      slug,
      this.requireUserId(user),
      updateArticleDto.article,
    );
  }

  @Delete(':slug')
  @HttpCode(204)
  @UseGuards(AuthTokenGuard)
  deleteArticle(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedRequest['user']) {
    return this.articlesService.deleteArticle(slug, this.requireUserId(user));
  }

  @Post(':slug/favorite')
  @UseGuards(AuthTokenGuard)
  favoriteArticle(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedRequest['user']) {
    return this.articlesService.favoriteArticle(slug, this.requireUserId(user));
  }

  @Delete(':slug/favorite')
  @UseGuards(AuthTokenGuard)
  unfavoriteArticle(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    return this.articlesService.unfavoriteArticle(slug, this.requireUserId(user));
  }

  @Get(':slug/comments')
  @UseGuards(OptionalAuthTokenGuard)
  getComments(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedRequest['user']) {
    return this.articlesService.getComments(slug, user?.id);
  }

  @Post(':slug/comments')
  @UseGuards(AuthTokenGuard)
  createComment(
    @Param('slug') slug: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    return this.articlesService.createComment(
      slug,
      this.requireUserId(user),
      createCommentDto.comment,
    );
  }

  @Delete(':slug/comments/:id')
  @HttpCode(204)
  @UseGuards(AuthTokenGuard)
  deleteComment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    return this.articlesService.deleteComment(slug, id, this.requireUserId(user));
  }

  private requireUserId(user: AuthenticatedRequest['user']) {
    if (!user) {
      throw new Error('Authenticated user is missing');
    }

    return user.id;
  }
}
