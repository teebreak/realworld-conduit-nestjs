import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';

export class UpdateArticleInput {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  tagList?: string[];
}

export class UpdateArticleDto {
  @ValidateNested()
  @Type(() => UpdateArticleInput)
  article!: UpdateArticleInput;
}
