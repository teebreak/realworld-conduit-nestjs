import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateNested } from 'class-validator';

export class CreateUserInput {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateUserDto {
  @ValidateNested()
  @Type(() => CreateUserInput)
  user!: CreateUserInput;
}
