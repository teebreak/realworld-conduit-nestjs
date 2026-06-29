import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateCommentInput {
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class CreateCommentDto {
  @ValidateNested()
  @Type(() => CreateCommentInput)
  comment!: CreateCommentInput;
}
