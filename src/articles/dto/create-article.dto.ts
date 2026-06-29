import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateArticleInput {
  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  description!: string;

  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  body!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagList?: string[];
}

export class CreateArticleDto {
  @ValidateNested()
  @Type(() => CreateArticleInput)
  article!: CreateArticleInput;
}
