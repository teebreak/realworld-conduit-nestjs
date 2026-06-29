import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateNested } from 'class-validator';

export class CreateUserInput {
  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  username!: string;

  @IsEmail()
  @IsNotEmpty({ message: "can't be blank" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "can't be blank" })
  @MinLength(8)
  password!: string;
}

export class CreateUserDto {
  @ValidateNested()
  @Type(() => CreateUserInput)
  user!: CreateUserInput;
}
