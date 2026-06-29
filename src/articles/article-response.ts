export interface ArticleResponse {
  article: ArticleView;
}

export interface MultipleArticlesResponse {
  articles: ArticleView[];
  articlesCount: number;
}

export interface ArticleView {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface CommentView {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export interface CommentResponse {
  comment: CommentView;
}

export interface MultipleCommentsResponse {
  comments: CommentView[];
}
