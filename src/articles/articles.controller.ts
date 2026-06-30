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
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RequiredUser } from '../auth/required-user.decorator.js';
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
  getFeed(@Query() query: ArticleQueryDto, @RequiredUser() user: AuthenticatedUser) {
    return this.articlesService.getFeed(user.id, query);
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
    @RequiredUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.createArticle(user.id, createArticleDto.article);
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
    @RequiredUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.updateArticle(slug, user.id, updateArticleDto.article);
  }

  @Delete(':slug')
  @HttpCode(204)
  @UseGuards(AuthTokenGuard)
  deleteArticle(@Param('slug') slug: string, @RequiredUser() user: AuthenticatedUser) {
    return this.articlesService.deleteArticle(slug, user.id);
  }

  @Post(':slug/favorite')
  @HttpCode(200)
  @UseGuards(AuthTokenGuard)
  favoriteArticle(@Param('slug') slug: string, @RequiredUser() user: AuthenticatedUser) {
    return this.articlesService.favoriteArticle(slug, user.id);
  }

  @Delete(':slug/favorite')
  @HttpCode(200)
  @UseGuards(AuthTokenGuard)
  unfavoriteArticle(@Param('slug') slug: string, @RequiredUser() user: AuthenticatedUser) {
    return this.articlesService.unfavoriteArticle(slug, user.id);
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
    @RequiredUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.createComment(slug, user.id, createCommentDto.comment);
  }

  @Delete(':slug/comments/:id')
  @HttpCode(204)
  @UseGuards(AuthTokenGuard)
  deleteComment(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @RequiredUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.deleteComment(slug, id, user.id);
  }
}
