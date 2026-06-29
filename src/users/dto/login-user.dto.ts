import { Type } from 'class-transformer';
import { IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';

export class LoginUserInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginUserDto {
  @ValidateNested()
  @Type(() => LoginUserInput)
  user!: LoginUserInput;
}
