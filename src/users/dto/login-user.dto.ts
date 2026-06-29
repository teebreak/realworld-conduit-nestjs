import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateNested } from 'class-validator';

export class LoginUserInput {
  @IsEmail()
  @IsNotEmpty({ message: "can't be blank" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  @MinLength(8)
  password!: string;
}

export class LoginUserDto {
  @ValidateNested()
  @Type(() => LoginUserInput)
  user!: LoginUserInput;
}
